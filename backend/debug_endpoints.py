import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from venues.views import VenueViewSet, BookingViewSet
from events.views import EventViewSet
from payments.views import PaymentHistoryView
from users.views import UserListView

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.filter(role='admin').first()

print("Using admin user:", admin_user)

factory = APIRequestFactory()

def test_view(view_cls, action_or_method, url, detail=False, pk=None):
    print(f"Testing {view_cls.__name__} {action_or_method} {url}...")
    try:
        request = factory.get(url)
        force_authenticate(request, user=admin_user)
        if view_cls in [PaymentHistoryView, UserListView]:
            view = view_cls.as_view()
            response = view(request)
        else:
            # ViewSet
            view = view_cls.as_view({'get': 'list'})
            response = view(request)
        print("Response status code:", response.status_code)
        if response.status_code != 200:
            print("Error details:", response.data)
    except Exception as e:
        import traceback
        traceback.print_exc()

test_view(VenueViewSet, 'list', '/api/venues/')
test_view(BookingViewSet, 'list', '/api/venues/bookings/')
test_view(EventViewSet, 'list', '/api/events/')
test_view(PaymentHistoryView, 'get', '/api/payments/history/')
test_view(UserListView, 'get', '/api/users/list/')
