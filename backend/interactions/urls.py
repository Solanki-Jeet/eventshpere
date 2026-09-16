from django.urls import path, include
from rest_framework.routers import DefaultRouter
from interactions.views import WishlistViewSet, NotificationViewSet, NewsletterSubscribeView

router = DefaultRouter()
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='newsletter_subscribe'),
    path('', include(router.urls)),
]
