from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
import pandas as pd
from .services import DjangoDataAnalyticsService
from .ml_service import EventRevenuePredictorService
from django.db.models import Sum, Count, Q, Avg, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.http import HttpResponse
from datetime import datetime, timedelta
import csv

from events.models import Event, EventBooking, TicketType
from payments.models import Payment

# PDF generation imports
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

class IsOrganizerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['organizer', 'admin'] or request.user.is_staff

def get_filtered_queryset(user, request):
    """
    Parses request parameters to return filtered querysets for:
    - events
    - bookings (filtered by status='paid' or status='pending' where appropriate)
    - payments (filtered by status='completed')
    """
    events = Event.objects.all().select_related('organizer', 'venue')
    bookings = EventBooking.objects.all().select_related('event', 'customer', 'ticket_type')
    payments = Payment.objects.filter(booking_type='event', event_booking__isnull=False).select_related('event_booking', 'event_booking__event')

    # Security: restrict to organizer's events (unless user is staff/admin)
    if not (user.is_staff or user.role == 'admin'):
        events = events.filter(organizer=user)
        bookings = bookings.filter(event__organizer=user)
        payments = payments.filter(event_booking__event__organizer=user)
    else:
        # Admins can filter by specific organizer
        org_id = request.query_params.get('organizer_id')
        if org_id:
            events = events.filter(organizer_id=org_id)
            bookings = bookings.filter(event__organizer_id=org_id)
            payments = payments.filter(event_booking__event__organizer_id=org_id)

    # 1. Event Filter
    event_id = request.query_params.get('event_id')
    if event_id and event_id != 'all':
        events = events.filter(id=event_id)
        bookings = bookings.filter(event_id=event_id)
        payments = payments.filter(event_booking__event_id=event_id)

    # 2. Category Filter
    category = request.query_params.get('category')
    if category and category != 'all':
        events = events.filter(category__iexact=category)
        bookings = bookings.filter(event__category__iexact=category)
        payments = payments.filter(event_booking__event__category__iexact=category)

    # 3. Date Range Filter
    date_range = request.query_params.get('date_range')
    now = timezone.now()
    today = now.date()

    start_dt = None
    end_dt = None

    if date_range == 'today':
        start_dt = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        end_dt = timezone.make_aware(datetime.combine(today, datetime.max.time()))
    elif date_range == '7_days':
        start_dt = now - timedelta(days=7)
    elif date_range == '30_days':
        start_dt = now - timedelta(days=30)
    elif date_range == 'this_month':
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif date_range == 'last_month':
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = first_of_this_month - timedelta(microseconds=1)
        start_dt = (first_of_this_month - timedelta(days=28)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif date_range == 'this_year':
        start_dt = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif date_range == 'custom':
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        if start_str:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_str, "%Y-%m-%d"))
            except ValueError:
                pass
        if end_str:
            try:
                end_dt = timezone.make_aware(datetime.combine(datetime.strptime(end_str, "%Y-%m-%d"), datetime.max.time()))
            except ValueError:
                pass

    if start_dt:
        events = events.filter(date__gte=start_dt.date())
        bookings = bookings.filter(created_at__gte=start_dt)
        payments = payments.filter(created_at__gte=start_dt)
    if end_dt:
        events = events.filter(date__lte=end_dt.date())
        bookings = bookings.filter(created_at__lte=end_dt)
        payments = payments.filter(created_at__lte=end_dt)

    return events, bookings, payments

def compute_mom_trend(current_val, prev_val):
    """
    Computes percentage difference from previous month.
    """
    if prev_val == 0:
        return 100.0 if current_val > 0 else 0.0
    return round(((current_val - prev_val) / prev_val) * 100.0, 1)

class OrganizerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # Parse filtered sets
        events, bookings, payments = get_filtered_queryset(request.user, request)

        # Base KPI computations
        tot_rev = payments.filter(status='completed').aggregate(sum=Sum('amount'))['sum'] or 0.0
        tot_tix = bookings.filter(status='paid').aggregate(sum=Sum('tickets_count'))['sum'] or 0
        tot_vists = bookings.filter(status='paid').values('customer').distinct().count()
        tot_evs = events.count()

        act_evs = events.filter(status='approved', date__gte=today).count()
        comp_evs = events.filter(date__lt=today).count()
        up_evs = events.filter(status='approved', date__gt=today).count()
        pend_bks = bookings.filter(status='pending').count()

        # Today's Revenue and Monthly Revenue
        today_rev = payments.filter(status='completed', created_at__date=today).aggregate(sum=Sum('amount'))['sum'] or 0.0
        month_rev = payments.filter(status='completed', created_at__month=now.month, created_at__year=now.year).aggregate(sum=Sum('amount'))['sum'] or 0.0

        # Calculate MoM comparison (current month vs previous month)
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_prev_month = first_of_this_month - timedelta(microseconds=1)
        start_of_prev_month = (first_of_this_month - timedelta(days=28)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Retrieve previous month query sets
        prev_events = Event.objects.filter(date__gte=start_of_prev_month.date(), date__lte=end_of_prev_month.date())
        prev_bookings = EventBooking.objects.filter(created_at__gte=start_of_prev_month, created_at__lte=end_of_prev_month)
        prev_payments = Payment.objects.filter(booking_type='event', created_at__gte=start_of_prev_month, created_at__lte=end_of_prev_month)

        if not (request.user.is_staff or request.user.role == 'admin'):
            prev_events = prev_events.filter(organizer=request.user)
            prev_bookings = prev_bookings.filter(event__organizer=request.user)
            prev_payments = prev_payments.filter(event_booking__event__organizer=request.user)

        # Previous month values
        prev_rev = prev_payments.filter(status='completed').aggregate(sum=Sum('amount'))['sum'] or 0.0
        prev_tix = prev_bookings.filter(status='paid').aggregate(sum=Sum('tickets_count'))['sum'] or 0
        prev_vists = prev_bookings.filter(status='paid').values('customer').distinct().count()
        prev_evs = prev_events.count()

        # Compute percentage increases
        rev_trend = compute_mom_trend(tot_rev, prev_rev)
        tix_trend = compute_mom_trend(tot_tix, prev_tix)
        vists_trend = compute_mom_trend(tot_vists, prev_vists)
        evs_trend = compute_mom_trend(tot_evs, prev_evs)

        # Booking Status Distribution (Pie Chart)
        status_dist = bookings.values('status').annotate(count=Count('id')).order_by('status')
        status_labels = [s['status'].capitalize() for s in status_dist]
        status_values = [s['count'] for s in status_dist]

        # Top Performing Events (order by revenue)
        top_events = events.annotate(
            tickets_sold=Sum('bookings__tickets_count', filter=Q(bookings__status='paid')),
            revenue=Sum('bookings__payments__amount', filter=Q(bookings__payments__status='completed')),
            visitors=Count('bookings__customer', distinct=True, filter=Q(bookings__status='paid')),
            avg_rating=Avg('reviews__rating')
        ).order_by('-revenue')[:5]

        top_events_data = []
        for e in top_events:
            top_events_data.append({
                "name": e.title,
                "revenue": float(e.revenue or 0.0),
                "tickets_sold": e.tickets_sold or 0,
                "visitors": e.visitors or 0,
                "rating": round(e.avg_rating or 0.0, 1)
            })

        data = {
            "kpi": {
                "total_revenue": {"value": float(tot_rev), "trend": rev_trend, "direction": "up" if rev_trend >= 0 else "down"},
                "total_tickets_sold": {"value": tot_tix, "trend": tix_trend, "direction": "up" if tix_trend >= 0 else "down"},
                "total_visitors": {"value": tot_vists, "trend": vists_trend, "direction": "up" if vists_trend >= 0 else "down"},
                "total_events": {"value": tot_evs, "trend": evs_trend, "direction": "up" if evs_trend >= 0 else "down"},
                "active_events": {"value": act_evs},
                "completed_events": {"value": comp_evs},
                "upcoming_events": {"value": up_evs},
                "pending_bookings": {"value": pend_bks},
                "today_revenue": {"value": float(today_rev)},
                "monthly_revenue": {"value": float(month_rev)}
            },
            "booking_status": {
                "labels": status_labels,
                "values": status_values
            },
            "top_performing_events": top_events_data
        }

        return Response(data)

class OrganizerRevenueView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        events, bookings, payments = get_filtered_queryset(request.user, request)
        date_range = request.query_params.get('date_range', '30_days')

        # Select truncation interval
        if date_range in ['today', '7_days', '30_days']:
            trunc_func = TruncDay
        elif date_range == 'this_year':
            trunc_func = TruncMonth
        else:
            trunc_func = TruncDay

        rev_history = payments.filter(status='completed') \
            .annotate(period=trunc_func('created_at')) \
            .values('period') \
            .annotate(total=Sum('amount')) \
            .order_by('period')

        labels = []
        values = []
        for r in rev_history:
            if date_range == 'this_year':
                labels.append(r['period'].strftime('%B'))
            else:
                labels.append(r['period'].strftime('%Y-%m-%d'))
            values.append(float(r['total'] or 0.0))

        # Monthly sales chart for current year (Jan-Dec)
        now = timezone.now()
        monthly_sales = payments.filter(status='completed', created_at__year=now.year) \
            .annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(total=Sum('amount')) \
            .order_by('month')

        all_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_values = [0.0] * 12
        for m in monthly_sales:
            idx = m['month'].month - 1
            if 0 <= idx < 12:
                monthly_values[idx] = float(m['total'] or 0.0)

        return Response({
            "revenue_chart": {
                "labels": labels,
                "values": values
            },
            "monthly_sales": {
                "labels": all_months,
                "values": monthly_values
            }
        })

class OrganizerTicketsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        events, bookings, payments = get_filtered_queryset(request.user, request)

        # 1. Tickets sold per event (Bar chart)
        sales_by_event = bookings.filter(status='paid') \
            .values('event__title') \
            .annotate(sold=Sum('tickets_count')) \
            .order_by('-sold')[:10]

        event_labels = [s['event__title'] for s in sales_by_event]
        event_values = [s['sold'] for s in sales_by_event]

        # 2. Ticket Type Distribution (VIP, Gold, Silver, Student Pass, Early Bird)
        ticket_dist = bookings.filter(status='paid', ticket_type__isnull=False) \
            .values('ticket_type__name') \
            .annotate(sold=Sum('tickets_count')) \
            .order_by('-sold')

        type_labels = [t['ticket_type__name'] for t in ticket_dist]
        type_values = [t['sold'] for t in ticket_dist]

        return Response({
            "tickets_sold_chart": {
                "labels": event_labels,
                "values": event_values
            },
            "ticket_type_distribution": {
                "labels": type_labels,
                "values": type_values
            }
        })

class OrganizerVisitorsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        events, bookings, payments = get_filtered_queryset(request.user, request)
        date_range = request.query_params.get('date_range', '30_days')

        if date_range in ['today', '7_days', '30_days']:
            trunc_func = TruncDay
        elif date_range == 'this_year':
            trunc_func = TruncMonth
        else:
            trunc_func = TruncDay

        visitors_history = bookings.filter(status='paid') \
            .annotate(period=trunc_func('created_at')) \
            .values('period') \
            .annotate(count=Count('customer', distinct=True)) \
            .order_by('period')

        labels = []
        values = []
        for v in visitors_history:
            if date_range == 'this_year':
                labels.append(v['period'].strftime('%B'))
            else:
                labels.append(v['period'].strftime('%Y-%m-%d'))
            values.append(v['count'])

        return Response({
            "visitor_chart": {
                "labels": labels,
                "values": values
            }
        })

class OrganizerEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        events, bookings, payments = get_filtered_queryset(request.user, request)

        # Annotate event metrics
        event_performance = events.annotate(
            tickets_sold=Sum('bookings__tickets_count', filter=Q(bookings__status='paid')),
            revenue=Sum('bookings__payments__amount', filter=Q(bookings__payments__status='completed')),
            visitors=Count('bookings__customer', distinct=True, filter=Q(bookings__status='paid')),
            avg_rating=Avg('reviews__rating')
        ).order_by('-revenue')

        performance_data = []
        for e in event_performance:
            t_sold = e.tickets_sold or 0
            occupancy = round((t_sold / e.total_tickets) * 100.0, 1) if e.total_tickets > 0 else 0.0
            
            performance_data.append({
                "id": e.id,
                "name": e.title,
                "revenue": float(e.revenue or 0.0),
                "tickets_sold": t_sold,
                "visitors": e.visitors or 0,
                "occupancy": occupancy,
                "status": e.status
            })

        return Response(performance_data)

class OrganizerReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        format_type = request.query_params.get('export_format', 'csv')
        report_type = request.query_params.get('report_type', 'revenue')

        events, bookings, payments = get_filtered_queryset(request.user, request)

        filename = f"{report_type}_report_{timezone.now().strftime('%Y%m%d_%H%M%S')}"

        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            writer = csv.writer(response)

            if report_type == 'revenue':
                writer.writerow(['Date', 'Transaction ID', 'Event Name', 'Customer Email', 'Status', 'Amount (INR)'])
                pay_list = payments.filter(status='completed')
                for p in pay_list:
                    writer.writerow([
                        p.created_at.strftime('%Y-%m-%d %H:%M'),
                        p.transaction_id or p.payment_id or 'N/A',
                        p.event_booking.event.title,
                        p.event_booking.customer.email,
                        p.status.upper(),
                        p.amount
                    ])
            elif report_type == 'tickets':
                writer.writerow(['Event Name', 'Ticket Category', 'Price', 'Sold', 'Remaining', 'Total Quantity', 'Total Revenue'])
                ticket_dist = bookings.filter(status='paid') \
                    .values('event__title', 'ticket_type__name', 'ticket_type__price', 'ticket_type__remaining_quantity', 'ticket_type__total_quantity') \
                    .annotate(sold=Sum('tickets_count'))
                for t in ticket_dist:
                    price = float(t['ticket_type__price'] or 0.0)
                    sold = t['sold'] or 0
                    writer.writerow([
                        t['event__title'],
                        t['ticket_type__name'] or 'General Pass',
                        price,
                        sold,
                        t['ticket_type__remaining_quantity'] or 0,
                        t['ticket_type__total_quantity'] or 0,
                        price * sold
                    ])
            elif report_type == 'bookings':
                writer.writerow(['Booking ID', 'Event Name', 'Customer Email', 'Ticket Category', 'Tickets Count', 'Total Price', 'Status', 'Date Booked'])
                for b in bookings:
                    writer.writerow([
                        b.id,
                        b.event.title,
                        b.customer.email,
                        b.ticket_type.name if b.ticket_type else 'General Pass',
                        b.tickets_count,
                        b.total_price,
                        b.status.upper(),
                        b.created_at.strftime('%Y-%m-%d %H:%M')
                    ])
            return response

        elif format_type == 'pdf':
            # Dynamic PDF Report using ReportLab
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'

            # Draw report to buffer
            p = canvas.Canvas(response, pagesize=letter)
            
            # Header banner
            p.setFillColorRGB(0.12, 0.16, 0.23) # Slate Accent
            p.rect(50, 710, 500, 60, fill=True)
            p.setFillColorRGB(1, 1, 1)
            p.setFont("Helvetica-Bold", 18)
            p.drawString(140, 732, "ORGANIZER ANALYTICS REPORT")

            # Report Meta
            p.setFillColorRGB(0.2, 0.2, 0.2)
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, 675, f"Report Type: {report_type.upper()}")
            p.setFont("Helvetica", 10)
            p.drawString(50, 655, f"Generated On: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
            p.drawString(50, 640, f"Organizer: {request.user.email}")

            p.line(50, 625, 550, 625)

            # Table Header
            p.setFont("Helvetica-Bold", 9)
            y = 600

            if report_type == 'revenue':
                p.drawString(50, y, "DATE")
                p.drawString(130, y, "TRANSACTION ID")
                p.drawString(240, y, "EVENT")
                p.drawString(380, y, "CUSTOMER")
                p.drawString(480, y, "AMOUNT")
                
                p.setFont("Helvetica", 8)
                pay_list = payments.filter(status='completed')[:20] # Limit to top 20 for preview
                for item in pay_list:
                    y -= 20
                    if y < 80:
                        p.showPage()
                        y = 750
                    p.drawString(50, y, item.created_at.strftime('%m-%d %H:%M'))
                    p.drawString(130, y, str(item.transaction_id or item.payment_id or 'N/A')[:18])
                    p.drawString(240, y, item.event_booking.event.title[:25])
                    p.drawString(380, y, item.event_booking.customer.email[:20])
                    p.drawString(480, y, f"INR {item.amount}")

            elif report_type == 'tickets':
                p.drawString(50, y, "EVENT")
                p.drawString(200, y, "CATEGORY")
                p.drawString(320, y, "PRICE")
                p.drawString(380, y, "SOLD")
                p.drawString(440, y, "REMAINING")
                p.drawString(500, y, "REVENUE")

                p.setFont("Helvetica", 8)
                ticket_dist = bookings.filter(status='paid') \
                    .values('event__title', 'ticket_type__name', 'ticket_type__price', 'ticket_type__remaining_quantity') \
                    .annotate(sold=Sum('tickets_count'))[:20]
                for item in ticket_dist:
                    y -= 20
                    if y < 80:
                        p.showPage()
                        y = 750
                    price = float(item['ticket_type__price'] or 0.0)
                    sold = item['sold'] or 0
                    p.drawString(50, y, item['event__title'][:28])
                    p.drawString(200, y, (item['ticket_type__name'] or 'General Pass')[:22])
                    p.drawString(320, y, f"INR {price}")
                    p.drawString(380, y, str(sold))
                    p.drawString(440, y, str(item['ticket_type__remaining_quantity'] or 0))
                    p.drawString(500, y, f"INR {price * sold}")

            elif report_type == 'bookings':
                p.drawString(50, y, "ID")
                p.drawString(80, y, "EVENT")
                p.drawString(230, y, "CUSTOMER")
                p.drawString(380, y, "TYPE")
                p.drawString(460, y, "COUNT")
                p.drawString(500, y, "TOTAL")

                p.setFont("Helvetica", 8)
                for item in bookings[:20]:
                    y -= 20
                    if y < 80:
                        p.showPage()
                        y = 750
                    p.drawString(50, y, str(item.id))
                    p.drawString(80, y, item.event.title[:28])
                    p.drawString(230, y, item.customer.email[:28])
                    p.drawString(380, y, (item.ticket_type.name if item.ticket_type else 'General')[:14])
                    p.drawString(460, y, str(item.tickets_count))
                    p.drawString(500, y, f"INR {item.total_price}")

            # Draw footer notice
            p.drawString(50, 45, "* Note: PDF reports generated show current snapshot bounds. Large datasets are truncated to page limits.")
            p.showPage()
            p.save()
            return response

        return Response({"error": "Unsupported download format"}, status=status.HTTP_400_BAD_REQUEST)


class OrganizerPandasAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get(self, request):
        organizer = request.user
        date_filter = request.query_params.get('date_range', 'all')
        
        service = DjangoDataAnalyticsService()
        events_df = service.get_events_df()
        bookings_df = service.get_event_bookings_df()
        ticket_types_df = service.get_ticket_types_df()

        is_admin = organizer.is_staff or organizer.role == 'admin'
        
        if not is_admin:
            events_df = events_df[events_df['organizer_id'] == organizer.id]
        
        event_ids = events_df['id'].tolist()
        bookings_df = bookings_df[bookings_df['event_id'].isin(event_ids)]
        ticket_types_df = ticket_types_df[ticket_types_df['event_id'].isin(event_ids)]

        now = timezone.now()
        if date_filter == '7_days':
            limit_date = now - timedelta(days=7)
            bookings_df = bookings_df[bookings_df['created_at'] >= pd.to_datetime(limit_date)]
        elif date_filter == '30_days':
            limit_date = now - timedelta(days=30)
            bookings_df = bookings_df[bookings_df['created_at'] >= pd.to_datetime(limit_date)]
        elif date_filter == 'this_month':
            limit_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            bookings_df = bookings_df[bookings_df['created_at'] >= pd.to_datetime(limit_date)]
        elif date_filter == 'this_year':
            limit_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            bookings_df = bookings_df[bookings_df['created_at'] >= pd.to_datetime(limit_date)]

        total_events = len(events_df)
        if total_events > 0:
            status_counts = events_df['status'].value_counts().to_dict()
        else:
            status_counts = {}
        
        paid_bookings = bookings_df[bookings_df['status'] == 'paid']
        
        total_tickets_sold = int(paid_bookings['tickets_count'].sum()) if not paid_bookings.empty else 0
        total_ticket_revenue = float(paid_bookings['total_price'].sum()) if not paid_bookings.empty else 0.0
        average_ticket_price = float(paid_bookings['total_price'].sum() / paid_bookings['tickets_count'].sum()) if (not paid_bookings.empty and paid_bookings['tickets_count'].sum() > 0) else 0.0

        monthly_rev_list = []
        monthly_sales_list = []
        if not paid_bookings.empty:
            paid_bookings_dt = paid_bookings.copy()
            paid_bookings_dt['month_name'] = paid_bookings_dt['created_at'].dt.strftime('%Y-%m')
            
            monthly_grouped = paid_bookings_dt.groupby('month_name').agg(
                revenue=('total_price', 'sum'),
                tickets_sold=('tickets_count', 'sum')
            ).reset_index()
            
            monthly_rev_list = monthly_grouped[['month_name', 'revenue']].rename(columns={'month_name': 'label', 'revenue': 'value'}).to_dict(orient='records')
            monthly_sales_list = monthly_grouped[['month_name', 'tickets_sold']].rename(columns={'month_name': 'label', 'tickets_sold': 'value'}).to_dict(orient='records')

        event_perf_list = []
        most_successful_event = None
        if not paid_bookings.empty and not events_df.empty:
            merged = pd.merge(paid_bookings, events_df, left_on='event_id', right_on='id', suffixes=('_booking', '_event'))
            if not merged.empty:
                event_grouped = merged.groupby('title').agg(
                    revenue=('total_price', 'sum'),
                    tickets_sold=('tickets_count', 'sum')
                ).reset_index()
                event_perf_list = event_grouped.to_dict(orient='records')
                
                if not event_grouped.empty:
                    top_row = event_grouped.loc[event_grouped['revenue'].idxmax()]
                    most_successful_event = {
                        "title": top_row['title'],
                        "revenue": float(top_row['revenue']),
                        "tickets_sold": int(top_row['tickets_sold'])
                    }

        ticket_type_perf = []
        if not paid_bookings.empty and not ticket_types_df.empty:
            merged_tt = pd.merge(paid_bookings, ticket_types_df, left_on='ticket_type_id', right_on='id')
            if not merged_tt.empty:
                tt_grouped = merged_tt.groupby('name').agg(
                    revenue=('total_price', 'sum'),
                    tickets_sold=('tickets_count', 'sum')
                ).reset_index()
                ticket_type_perf = tt_grouped.to_dict(orient='records')

        response_data = {
            "summary": {
                "total_events": total_events,
                "approved_events": status_counts.get('approved', 0),
                "pending_events": status_counts.get('pending', 0),
                "rejected_events": status_counts.get('rejected', 0),
                "total_tickets_sold": total_tickets_sold,
                "total_ticket_revenue": total_ticket_revenue,
                "average_ticket_price": average_ticket_price,
                "most_successful_event": most_successful_event
            },
            "charts": {
                "monthly_revenue": monthly_rev_list,
                "monthly_ticket_sales": monthly_sales_list,
                "event_performance": event_perf_list,
                "ticket_type_performance": ticket_type_perf
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser


class AdminPandasAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        date_filter = request.query_params.get('date_range', 'all')
        
        service = DjangoDataAnalyticsService()
        events_df = service.get_events_df()
        bookings_df = service.get_event_bookings_df()
        ticket_types_df = service.get_ticket_types_df()
        venues_df = service.get_venues_df()
        venue_bookings_df = service.get_venue_bookings_df()
        payments_df = service.get_payments_df()

        # Date range filtering
        now = timezone.now()
        if date_filter != 'all':
            if date_filter == '7_days':
                limit_date = now - timedelta(days=7)
            elif date_filter == '30_days':
                limit_date = now - timedelta(days=30)
            elif date_filter == 'this_month':
                limit_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif date_filter == 'this_year':
                limit_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                limit_date = None

            if limit_date:
                limit_pd = pd.to_datetime(limit_date)
                if not bookings_df.empty:
                    bookings_df = bookings_df[bookings_df['created_at'] >= limit_pd]
                if not venue_bookings_df.empty:
                    venue_bookings_df = venue_bookings_df[venue_bookings_df['created_at'] >= limit_pd]
                if not payments_df.empty:
                    payments_df = payments_df[payments_df['created_at'] >= limit_pd]

        # Calculate EVENTS Metrics
        total_events = len(events_df)
        event_status_counts = events_df['status'].value_counts().to_dict() if total_events > 0 else {}
        event_categories = events_df['category'].value_counts().to_dict() if total_events > 0 else {}
        avg_ticket_price = float(events_df['ticket_price'].mean()) if total_events > 0 else 0.0

        most_popular_events = []
        paid_bookings = bookings_df[bookings_df['status'] == 'paid'] if not bookings_df.empty else pd.DataFrame()
        if not paid_bookings.empty and not events_df.empty:
            merged_events = pd.merge(paid_bookings, events_df, left_on='event_id', right_on='id')
            if not merged_events.empty:
                event_pop = merged_events.groupby('title').agg(
                    tickets_sold=('tickets_count', 'sum'),
                    bookings_count=('id_x', 'count')
                ).reset_index()
                most_popular_events = event_pop.sort_values(by='tickets_sold', ascending=False).head(5).to_dict(orient='records')

        # Calculate VENUES Metrics
        total_venues = len(venues_df)
        venue_status_counts = venues_df['approval_status'].value_counts().to_dict() if total_venues > 0 else {}
        avg_venue_price = float(venues_df['price_per_day'].mean()) if total_venues > 0 else 0.0

        most_booked_venues = []
        confirmed_venue_bookings = venue_bookings_df[venue_bookings_df['status'].isin(['paid', 'approved', 'confirmed'])] if not venue_bookings_df.empty else pd.DataFrame()
        if not confirmed_venue_bookings.empty and not venues_df.empty:
            merged_venues = pd.merge(confirmed_venue_bookings, venues_df, left_on='venue_id', right_on='id')
            if not merged_venues.empty:
                venue_pop = merged_venues.groupby('name').size().reset_index(name='bookings_count')
                most_booked_venues = venue_pop.sort_values(by='bookings_count', ascending=False).head(5).to_dict(orient='records')

        venue_booking_approval_rate = 0.0
        if not venue_bookings_df.empty:
            total_v_b = len(venue_bookings_df)
            approved_v_b = len(venue_bookings_df[venue_bookings_df['status'].isin(['paid', 'approved', 'confirmed', 'completed'])])
            venue_booking_approval_rate = float(approved_v_b / total_v_b * 100)

        # Calculate BOOKINGS Metrics
        total_bookings = len(bookings_df) + len(venue_bookings_df)
        booking_success_rate = 0.0
        if total_bookings > 0:
            successful_bookings = 0
            if not bookings_df.empty:
                successful_bookings += len(bookings_df[bookings_df['status'] == 'paid'])
            if not venue_bookings_df.empty:
                successful_bookings += len(confirmed_venue_bookings)
            booking_success_rate = float(successful_bookings / total_bookings * 100)

        booking_status_counts = {}
        for df in [bookings_df, venue_bookings_df]:
            if not df.empty:
                for k, v in df['status'].value_counts().to_dict().items():
                    booking_status_counts[k] = booking_status_counts.get(k, 0) + v

        # Calculate REVENUE Metrics
        completed_payments = payments_df[payments_df['status'] == 'completed'] if not payments_df.empty else pd.DataFrame()
        total_revenue = float(completed_payments['amount'].sum()) if not completed_payments.empty else 0.0
        
        ticket_rev = float(completed_payments[completed_payments['booking_type'] == 'event']['amount'].sum()) if not completed_payments.empty else 0.0
        venue_rev = float(completed_payments[completed_payments['booking_type'] == 'venue']['amount'].sum()) if not completed_payments.empty else 0.0
        avg_transaction_value = float(completed_payments['amount'].mean()) if not completed_payments.empty else 0.0

        monthly_rev_list = []
        if not completed_payments.empty:
            completed_payments_dt = completed_payments.copy()
            completed_payments_dt['month_name'] = completed_payments_dt['created_at'].dt.strftime('%Y-%m')
            monthly_rev_list = completed_payments_dt.groupby('month_name')['amount'].sum().reset_index().rename(columns={'month_name': 'label', 'amount': 'value'}).to_dict(orient='records')

        response_data = {
            "events": {
                "total_events": total_events,
                "status_counts": event_status_counts,
                "categories": event_categories,
                "most_popular": most_popular_events,
                "average_ticket_price": avg_ticket_price
            },
            "venues": {
                "total_venues": total_venues,
                "status_counts": venue_status_counts,
                "most_booked": most_booked_venues,
                "average_price": avg_venue_price,
                "approval_rate": venue_booking_approval_rate
            },
            "bookings": {
                "total_bookings": total_bookings,
                "status_counts": booking_status_counts,
                "success_rate": booking_success_rate
            },
            "revenue": {
                "total_revenue": total_revenue,
                "ticket_revenue": ticket_rev,
                "venue_rental_revenue": venue_rev,
                "monthly_revenue": monthly_rev_list,
                "average_transaction_value": avg_transaction_value
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)


class EventRevenuePredictionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def post(self, request):
        ticket_price = request.data.get('ticket_price')
        total_tickets = request.data.get('total_tickets')
        category = request.data.get('category')
        venue_id = request.data.get('venue_id')

        if ticket_price is None or total_tickets is None or not category:
            return Response(
                {"error": "Please provide ticket_price, total_tickets, and category in request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            prediction = EventRevenuePredictorService.predict_revenue(
                ticket_price=float(ticket_price),
                total_tickets=int(total_tickets),
                category=str(category),
                venue_id=int(venue_id) if venue_id else None
            )
            return Response(prediction, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
