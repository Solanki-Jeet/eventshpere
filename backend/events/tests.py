from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time
from events.models import Event, EventSchedule
from events.serializers import EventScheduleSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

class EventScheduleTestCase(TestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            email="organizer_test@example.com",
            password="password123",
            role="organizer"
        )
        self.event = Event.objects.create(
            organizer=self.organizer,
            title="Tech Conference 2026",
            description="Leading conference on Agentic Coding",
            category="Technology",
            date=date(2026, 12, 1),
            time=time(9, 0),       # 9:00 AM
            end_time=time(17, 0),  # 5:00 PM
            ticket_price=100.0,
            total_tickets=100,
            available_tickets=100
        )

    def test_valid_schedule(self):
        # Create a valid schedule item
        serializer = EventScheduleSerializer(data={
            "title": "Registration",
            "description": "Attendees check-in and get badges",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "status": "active"
        }, context={"event": self.event})
        self.assertTrue(serializer.is_valid())
        serializer.save(event=self.event)
        self.assertEqual(self.event.schedules.count(), 1)

    def test_end_time_before_start_time(self):
        # Check end_time must be after start_time
        serializer = EventScheduleSerializer(data={
            "title": "Closing Ceremony",
            "description": "Event closes",
            "start_time": "16:00:00",
            "end_time": "15:00:00",
            "status": "active"
        }, context={"event": self.event})
        with self.assertRaises(ValidationError) as ctx:
            serializer.is_valid(raise_exception=True)
        self.assertIn("End time must be strictly after start time.", str(ctx.exception))

    def test_duplicate_session_title(self):
        # Check duplicate session title is rejected
        EventSchedule.objects.create(
            event=self.event,
            title="Workshop",
            description="First Workshop session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            status="active"
        )
        serializer = EventScheduleSerializer(data={
            "title": "Workshop",
            "description": "Duplicate session title",
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "status": "active"
        }, context={"event": self.event})
        with self.assertRaises(ValidationError) as ctx:
            serializer.is_valid(raise_exception=True)
        self.assertIn("A session with this title already exists", str(ctx.exception))

    def test_out_of_event_bounds(self):
        # Session time falls outside of Event bounds
        serializer = EventScheduleSerializer(data={
            "title": "Pre-registration",
            "description": "Check-in before event opens",
            "start_time": "08:00:00",
            "end_time": "09:30:00",
            "status": "active"
        }, context={"event": self.event})
        with self.assertRaises(ValidationError) as ctx:
            serializer.is_valid(raise_exception=True)
        self.assertIn("cannot be before the event's start time", str(ctx.exception))

    def test_overlapping_sessions(self):
        # Overlapping sessions are rejected
        EventSchedule.objects.create(
            event=self.event,
            title="Panel Discussion",
            description="Discussing tech trends",
            start_time=time(10, 0),
            end_time=time(11, 30),
            status="active"
        )
        # Attempt to overlap
        serializer = EventScheduleSerializer(data={
            "title": "Q&A Session",
            "description": "Questions and answers",
            "start_time": "11:00:00",
            "end_time": "12:00:00",
            "status": "active"
        }, context={"event": self.event})
        with self.assertRaises(ValidationError) as ctx:
            serializer.is_valid(raise_exception=True)
        self.assertIn("overlaps with an existing session", str(ctx.exception))
