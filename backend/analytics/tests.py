from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta
from rest_framework.test import APIClient
from events.models import Event, EventBooking, TicketType
from payments.models import Payment

User = get_user_model()

class OrganizerAnalyticsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organizer = User.objects.create_user(
            email="organizer@example.com",
            password="password123",
            role="organizer"
        )
        self.client.force_authenticate(user=self.organizer)

        self.event = Event.objects.create(
            organizer=self.organizer,
            title="Salsa Dancing Night",
            description="Learn how to dance salsa",
            category="Cultural",
            date=date(2026, 12, 5),
            time=time(19, 0),
            ticket_price=50.0,
            total_tickets=100,
            available_tickets=100
        )

        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name="General Pass",
            price=50.0,
            total_quantity=100,
            remaining_quantity=95,
            sale_start=timezone.now() - timedelta(days=1),
            sale_end=timezone.now() + timedelta(days=5),
            status="active"
        )

        # Create booking and payment
        self.customer = User.objects.create_user(
            email="customer@example.com",
            password="password123",
            role="customer"
        )
        self.booking = EventBooking.objects.create(
            customer=self.customer,
            event=self.event,
            ticket_type=self.ticket_type,
            tickets_count=5,
            total_price=250.0,
            status="paid"
        )
        self.payment = Payment.objects.create(
            booking_type="event",
            event_booking=self.booking,
            amount=250.0,
            status="completed"
        )

    def test_dashboard_kpis(self):
        response = self.client.get('/api/organizer/dashboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['kpi']['total_revenue']['value'], 250.0)
        self.assertEqual(data['kpi']['total_tickets_sold']['value'], 5)
        self.assertEqual(data['kpi']['total_events']['value'], 1)

    def test_revenue_chart(self):
        response = self.client.get('/api/organizer/revenue/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('revenue_chart', data)
        self.assertIn('monthly_sales', data)

    def test_tickets_chart(self):
        response = self.client.get('/api/organizer/tickets/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('tickets_sold_chart', data)
        self.assertIn('ticket_type_distribution', data)

    def test_reports_pdf_download(self):
        response = self.client.get('/api/organizer/reports/?export_format=pdf&report_type=revenue')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')

    def test_reports_csv_download(self):
        response = self.client.get('/api/organizer/reports/?export_format=csv&report_type=tickets')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
