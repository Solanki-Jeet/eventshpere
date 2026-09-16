from django.urls import path, include
from rest_framework.routers import DefaultRouter
from venues.views import VenueViewSet, BookingViewSet, ImageUploadView, MaintenanceDayViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'maintenance', MaintenanceDayViewSet, basename='maintenance')
router.register(r'', VenueViewSet, basename='venue') # Must be last if it uses empty prefix in router

urlpatterns = [
    path('upload/', ImageUploadView.as_view(), name='image_upload'),
    path('', include(router.urls)),
]
