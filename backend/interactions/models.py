from django.db import models
from django.conf import settings
from venues.models import Venue
from events.models import Event

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, null=True, blank=True, related_name='wishlisted_by')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # Ensure unique wishlist items per user/venue or user/event
            models.UniqueConstraint(
                fields=['user', 'venue'], 
                name='unique_user_venue_wishlist',
                condition=models.Q(venue__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['user', 'event'], 
                name='unique_user_event_wishlist',
                condition=models.Q(event__isnull=False)
            ),
        ]

    def __str__(self):
        item = self.venue.name if self.venue else self.event.title
        return f"{self.user.email} saved {item}"

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title} (Read: {self.is_read})"

class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True)
    status = models.CharField(max_length=20, default='subscribed') # 'subscribed', 'unsubscribed'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} ({self.status})"
