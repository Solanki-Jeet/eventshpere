from rest_framework import serializers
from interactions.models import Wishlist, Notification
from venues.serializers import VenueSerializer
from events.serializers import EventSerializer

class WishlistSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    venue_details = VenueSerializer(source='venue', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'user', 'venue', 'event', 'venue_details', 'event_details', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        venue = attrs.get('venue')
        event = attrs.get('event')
        
        if not venue and not event:
            raise serializers.ValidationError("Must select either a venue or an event to wishlist.")
        if venue and event:
            raise serializers.ValidationError("Cannot wishlist both a venue and an event in a single entry.")
            
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'is_read', 'created_at')
        read_only_fields = ('id', 'title', 'message', 'created_at')
