from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from interactions.models import Wishlist, Notification
from interactions.serializers import WishlistSerializer, NotificationSerializer

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle_wishlist(self, request):
        """
        Toggles a wishlist item. If it exists, deletes it. If not, creates it.
        """
        venue_id = request.data.get('venue')
        event_id = request.data.get('event')
        
        if not venue_id and not event_id:
            return Response({"error": "Select either a venue or an event."}, status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        if venue_id:
            wishlist_item = Wishlist.objects.filter(user=user, venue_id=venue_id)
            if wishlist_item.exists():
                wishlist_item.delete()
                return Response({"status": "removed", "message": "Venue removed from wishlist."}, status=status.HTTP_200_OK)
            else:
                Wishlist.objects.create(user=user, venue_id=venue_id)
                return Response({"status": "added", "message": "Venue added to wishlist."}, status=status.HTTP_201_CREATED)
        else:
            wishlist_item = Wishlist.objects.filter(user=user, event_id=event_id)
            if wishlist_item.exists():
                wishlist_item.delete()
                return Response({"status": "removed", "message": "Event removed from wishlist."}, status=status.HTTP_200_OK)
            else:
                Wishlist.objects.create(user=user, event_id=event_id)
                return Response({"status": "added", "message": "Event added to wishlist."}, status=status.HTTP_201_CREATED)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Security: only the notification's owner can delete it
        if instance.user != request.user:
            return Response({"error": "You cannot delete this notification."}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='delete-all')
    def delete_all(self, request):
        """Delete all notifications for the current user."""
        Notification.objects.filter(user=request.user).delete()
        return Response({"message": "All notifications cleared."}, status=status.HTTP_204_NO_CONTENT)

from rest_framework.views import APIView
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
            
        from interactions.models import NewsletterSubscription
        if NewsletterSubscription.objects.filter(email=email).exists():
            return Response({"error": "This email is already subscribed."}, status=status.HTTP_400_BAD_REQUEST)
            
        NewsletterSubscription.objects.create(email=email, status='subscribed')
        return Response({"message": "Successfully subscribed to our newsletter!"}, status=status.HTTP_201_CREATED)

