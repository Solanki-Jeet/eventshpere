from django.urls import path, include
from rest_framework.routers import DefaultRouter
from events.views import EventViewSet, ReviewViewSet, EventBookingViewSet, LiveAhmedabadEventsView, TicketTypeViewSet, EventScheduleViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'bookings', EventBookingViewSet, basename='eventbooking')
router.register(r'tickets', TicketTypeViewSet, basename='tickettype')
router.register(r'schedule', EventScheduleViewSet, basename='schedule')
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('live/', LiveAhmedabadEventsView.as_view(), name='live_events'),
    path('', include(router.urls)),
]
