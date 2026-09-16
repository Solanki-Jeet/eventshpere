from django.db import models
from django.conf import settings
from venues.models import Venue

class Event(models.Model):
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='events')
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    category = models.CharField(max_length=100, db_index=True)
    date = models.DateField(db_index=True)
    end_date = models.DateField(null=True, blank=True, db_index=True)
    time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    total_tickets = models.PositiveIntegerField()
    available_tickets = models.PositiveIntegerField()
    images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_events')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.organizer.email}"

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    rating = models.PositiveIntegerField() # Should validate 1-5 in serializer
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.email} (Rating: {self.rating})"

class TicketType(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total_quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    max_per_user = models.PositiveIntegerField(default=10)
    sale_start = models.DateTimeField()
    sale_end = models.DateTimeField()
    benefits = models.JSONField(default=list, blank=True)
    color = models.CharField(max_length=50, default='blue')
    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('event', 'name')
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.name} for {self.event.title} (Price: {self.price})"

class EventBooking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_bookings')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    tickets_count = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    qr_code_hash = models.CharField(max_length=100, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        import uuid
        if not self.qr_code_hash:
            self.qr_code_hash = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} for {self.event.title} by {self.customer.email} ({self.status})"

class EventSchedule(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    speaker_name = models.CharField(max_length=255, null=True, blank=True)
    venue_room = models.CharField(max_length=255, null=True, blank=True)
    display_order = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.event.title} ({self.start_time} - {self.end_time})"
