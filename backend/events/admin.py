from django.contrib import admin
from events.models import Event, Review

class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'category', 'date', 'ticket_price', 'total_tickets', 'available_tickets')
    list_filter = ('category', 'date')
    search_fields = ('title', 'description', 'organizer__email')

class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'venue', 'event', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('comment', 'user__email')

admin.site.register(Event, EventAdmin)
admin.site.register(Review, ReviewAdmin)
