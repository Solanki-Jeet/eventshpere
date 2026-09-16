from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
from events.models import Event, EventBooking
from payments.models import Coupon, Payment

User = get_user_model()

class PaymentAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='password123',
            role='customer'
        )
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            password='password123',
            role='organizer'
        )
        
        # Create a test event
        self.event = Event.objects.create(
            organizer=self.organizer,
            title='Vibrant Garba Event',
            description='Garba night at riverfront',
            category='Social / Garba',
            date=timezone.now().date() + timedelta(days=5),
            time='19:00:00',
            ticket_price=500.00,
            total_tickets=100,
            available_tickets=100
        )
        
        # Create a test TicketType
        from events.models import TicketType
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name='General Pass',
            description='Standard entry pass',
            price=500.00,
            total_quantity=100,
            remaining_quantity=100,
            max_per_user=100,
            sale_start=timezone.now() - timedelta(days=1),
            sale_end=timezone.now() + timedelta(days=5),
            status='active'
        )
        
        # Create a coupon (clearing migration seed duplicate first)
        Coupon.objects.filter(code='AHMEDABAD20').delete()
        self.coupon = Coupon.objects.create(
            code='AHMEDABAD20',
            discount_percent=20,
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=5),
            active=True
        )

        self.booking_url = reverse('eventbooking-list')
        self.order_url = reverse('create_payment_order')
        self.verify_url = reverse('verify_payment')
        self.coupon_url = reverse('validate_coupon')

    def test_coupon_validation(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f"{self.coupon_url}?code=AHMEDABAD20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['discount_percent'], 20)

    def test_event_booking_ticket_limit_validation(self):
        self.client.force_authenticate(user=self.customer)
        
        # Booking more tickets than available should fail
        booking_data = {
            'event': self.event.id,
            'ticket_type': self.ticket_type.id,
            'tickets_count': 150 # limit is 100
        }
        response = self.client.post(self.booking_url, booking_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tickets_count', response.data)

    def test_payment_checkout_flow_and_simulated_verification(self):
        self.client.force_authenticate(user=self.customer)
        
        # 1. Create a pending booking
        booking_data = {
            'event': self.event.id,
            'ticket_type': self.ticket_type.id,
            'tickets_count': 2
        }
        booking_res = self.client.post(self.booking_url, booking_data, format='json')
        self.assertEqual(booking_res.status_code, status.HTTP_201_CREATED)
        booking_id = booking_res.data['id']
        self.assertEqual(float(booking_res.data['total_price']), 1000.00) # 2 tickets * 500

        # 2. Create order with coupon applied
        order_data = {
            'booking_type': 'event',
            'booking_id': booking_id,
            'coupon_code': 'AHMEDABAD20'
        }
        order_res = self.client.post(self.order_url, order_data, format='json')
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(order_res.data['amount']), 800.00) # 1000 - 20% discount
        self.assertTrue(order_res.data['is_simulated'])
        order_id = order_res.data['order_id']

        # 3. Verify Payment
        verify_data = {
            'razorpay_order_id': order_id,
            'status': 'completed'
        }
        verify_res = self.client.post(self.verify_url, verify_data, format='json')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)

        # 4. Check that event ticket inventory decreased and booking is paid
        booking_refreshed = EventBooking.objects.get(pk=booking_id)
        self.assertEqual(booking_refreshed.status, 'paid')
        
        event_refreshed = Event.objects.get(pk=self.event.id)
        self.assertEqual(event_refreshed.available_tickets, 98) # 100 - 2
