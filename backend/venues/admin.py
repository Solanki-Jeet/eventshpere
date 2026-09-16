from django.contrib import admin
from venues.models import Venue, Booking

class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'capacity', 'price_per_day', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('name', 'address', 'description')
    list_editable = ('is_approved',) # Allows quick approval directly from the list page!

class BookingAdmin(admin.ModelAdmin):
    list_display = ('venue', 'customer', 'start_date', 'end_date', 'total_price', 'status', 'created_at')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('venue__name', 'customer__email')

admin.site.register(Venue, VenueAdmin)
admin.site.register(Booking, BookingAdmin)
