from django.urls import path
from analytics.views import (
    OrganizerDashboardView, OrganizerRevenueView, OrganizerTicketsView,
    OrganizerVisitorsView, OrganizerEventsView, OrganizerReportsView,
    OrganizerPandasAnalyticsView, AdminPandasAnalyticsView,
    EventRevenuePredictionView
)

urlpatterns = [
    path('dashboard/', OrganizerDashboardView.as_view(), name='organizer_dashboard'),
    path('revenue/', OrganizerRevenueView.as_view(), name='organizer_revenue'),
    path('tickets/', OrganizerTicketsView.as_view(), name='organizer_tickets'),
    path('visitors/', OrganizerVisitorsView.as_view(), name='organizer_visitors'),
    path('events/', OrganizerEventsView.as_view(), name='organizer_events'),
    path('reports/', OrganizerReportsView.as_view(), name='organizer_reports'),
    path('organizer-pandas-analytics/', OrganizerPandasAnalyticsView.as_view(), name='organizer_pandas_analytics'),
    path('admin-pandas-analytics/', AdminPandasAnalyticsView.as_view(), name='admin_pandas_analytics'),
    path('predict-revenue/', EventRevenuePredictionView.as_view(), name='predict_revenue'),
]
