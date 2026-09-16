from django.contrib import admin
from interactions.models import Wishlist, Notification

class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'venue', 'event', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'venue__name', 'event__title')

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')

admin.site.register(Wishlist, WishlistAdmin)
admin.site.register(Notification, NotificationAdmin)
