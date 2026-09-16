from django.db import models
from django.utils import timezone
from django.conf import settings

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveIntegerField() # e.g. 15 for 15% off
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)

    def is_valid(self):
        now = timezone.now()
        return self.active and self.valid_from <= now <= self.valid_to

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% Off)"

class Payment(models.Model):
    BOOKING_TYPE_CHOICES = [
        ('event', 'Event Ticket'),
        ('venue', 'Venue Rental'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    event = models.ForeignKey('events.Event', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    venue = models.ForeignKey('venues.Venue', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES)
    event_booking = models.ForeignKey('events.EventBooking', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    venue_booking = models.ForeignKey('venues.Booking', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    transaction_id = models.CharField(max_length=255, blank=True, null=True) # Razorpay Order ID
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    payment_id = models.CharField(max_length=255, blank=True, null=True) # Razorpay Payment ID
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    payment_method = models.CharField(max_length=50, default='razorpay')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        item = f"Event Booking {self.event_booking_id}" if self.booking_type == 'event' else f"Venue Booking {self.venue_booking_id}"
        return f"Payment {self.id} for {item} (Status: {self.status}, Amount: ₹{self.amount})"
