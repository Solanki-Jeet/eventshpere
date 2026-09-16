from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta
from venues.models import Venue, Booking

User = get_user_model()

class VenueAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='password123',
            role='plot_owner'
        )
        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='password123',
            role='customer'
        )
        
        # Create venue
        self.venue = Venue.objects.create(
            owner=self.owner,
            name='Vibrant Party Plot',
            description='Perfect for weddings',
            address='Sindhu Bhavan, Ahmedabad',
            capacity=1000,
            price_per_day=50000.00,
            is_approved=True
        )
        
        self.venue_url = reverse('venue-list')
        self.booking_url = reverse('booking-list')

    def test_create_venue_as_plot_owner(self):
        self.client.force_authenticate(user=self.owner)
        data = {
            'name': 'Glow Banquet Hall',
            'description': 'Luxurious air-conditioned banquet hall',
            'address': 'Bodakdev, Ahmedabad',
            'capacity': 500,
            'price_per_day': 75000.00,
            'facilities': ['AC', 'Catering', 'Valet']
        }
        response = self.client.post(self.venue_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Glow Banquet Hall')
        self.assertFalse(response.data['is_approved']) # Pending approval by default

    def test_create_venue_as_customer_denied(self):
        self.client.force_authenticate(user=self.customer)
        data = {
            'name': 'Forbidden Plot',
            'description': 'Customer trying to list plot',
            'address': 'S.G Highway',
            'capacity': 800,
            'price_per_day': 40000.00
        }
        response = self.client.post(self.venue_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_booking_creation_and_overlap_validation(self):
        # Authenticate customer
        self.client.force_authenticate(user=self.customer)
        
        start_date = date.today() + timedelta(days=5)
        end_date = start_date + timedelta(days=2)
        
        # 1. Create first booking
        booking_data = {
            'venue': self.venue.id,
            'start_date': start_date,
            'end_date': end_date
        }
        response = self.client.post(self.booking_url, booking_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        booking_id = response.data['id']
        self.assertEqual(float(response.data['total_price']), 150000.00) # 3 days * 50,000
        
        # 2. Try creating overlapping booking (Will FAIL under new rules because it cannot overlap with a PENDING booking!)
        overlap_data = {
            'venue': self.venue.id,
            'start_date': start_date + timedelta(days=1),
            'end_date': end_date + timedelta(days=1)
        }
        response2 = self.client.post(self.booking_url, overlap_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response2.data)
        
        # 3. Approve the first booking (simulate owner or admin approval)
        booking1 = Booking.objects.get(pk=booking_id)
        booking1.status = 'approved'
        booking1.save()
        
        # 4. Try creating overlapping booking now (Must fail with validation error!)
        response3 = self.client.post(self.booking_url, overlap_data, format='json')
        self.assertEqual(response3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response3.data)
