from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from events.models import Event, Review, EventBooking, TicketType, EventSchedule
from events.serializers import EventSerializer, ReviewSerializer, EventBookingSerializer, TicketTypeSerializer, EventScheduleSerializer
from users.permissions import IsOrganizer, IsAdmin
from payments.models import Payment

from django.utils import timezone
from rest_framework.decorators import action

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'category']

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated, IsOrganizer | IsAdmin]
        elif self.action in ['update', 'partial_update', 'destroy', 'resubmit']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['approve', 'reject', 'pending']:
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action in ['my_events']:
            permission_classes = [permissions.IsAuthenticated, IsOrganizer | IsAdmin]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        my_events = self.request.query_params.get('my_events', 'false') == 'true'
        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        
        # New advanced filters query params
        search_query = self.request.query_params.get('search')
        city = self.request.query_params.get('city')
        venue_type = self.request.query_params.get('venue_type')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        date_shortcut = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        availability = self.request.query_params.get('availability')
        sort = self.request.query_params.get('sort')

        from django.db.models import Q, Count, Sum, Avg, Min, Max
        from datetime import timedelta
        from django.utils import timezone
        
        # Base Queryset with optimizations
        queryset = Event.objects.all().select_related('organizer', 'venue').prefetch_related('ticket_types')
        
        # 1. Search Query (Across multiple fields/relations)
        if search_query:
            search_query = search_query.strip()
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__icontains=search_query) |
                Q(tags__icontains=search_query) |
                Q(venue__name__icontains=search_query) |
                Q(venue__address__icontains=search_query) |
                Q(organizer__first_name__icontains=search_query) |
                Q(organizer__last_name__icontains=search_query) |
                Q(organizer__email__icontains=search_query)
            )

        # 2. City Filter (matches address)
        if city:
            queryset = queryset.filter(venue__address__icontains=city.strip())

        # 3. Category Filter
        if category:
            queryset = queryset.filter(category__iexact=category.strip())

        # 4. Venue Type Filter
        if venue_type:
            queryset = queryset.filter(venue__venue_type=venue_type.strip().lower())

        # 5. Price Range
        if min_price:
            try:
                queryset = queryset.filter(ticket_types__price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                queryset = queryset.filter(ticket_types__price__lte=float(max_price))
            except ValueError:
                pass

        # 6. Date shortcut or custom date range
        today = timezone.localdate()
        if date_shortcut:
            date_shortcut = date_shortcut.strip().lower()
            if date_shortcut == 'today':
                queryset = queryset.filter(date=today)
            elif date_shortcut == 'tomorrow':
                queryset = queryset.filter(date=today + timedelta(days=1))
            elif date_shortcut == 'this_week':
                queryset = queryset.filter(date__range=[today, today + timedelta(days=7)])
            elif date_shortcut == 'this_month':
                queryset = queryset.filter(date__year=today.year, date__month=today.month)
        elif start_date and end_date:
            from django.utils.dateparse import parse_date
            parsed_start = parse_date(start_date)
            parsed_end = parse_date(end_date)
            if parsed_start and parsed_end:
                queryset = queryset.filter(date__range=[parsed_start, parsed_end])

        # 7. Event Status (Upcoming, Ongoing, Completed)
        if status_param:
            status_param = status_param.strip().lower()
            if status_param == 'upcoming':
                queryset = queryset.filter(date__gt=today)
            elif status_param == 'ongoing':
                queryset = queryset.filter(date=today)
            elif status_param == 'completed':
                queryset = queryset.filter(date__lt=today)
            else:
                # Fallback to default event model status check
                queryset = queryset.filter(status=status_param)
        # 8. Action & Role filter
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if user and user.is_authenticated:
                if user.role in ['admin', 'staff'] or user.is_staff:
                    pass
                else:
                    queryset = queryset.filter(Q(organizer=user) | Q(status='approved'))
        elif user and user.is_authenticated:
            if user.role == 'organizer':
                if my_events:
                    queryset = queryset.filter(organizer=user)
                else:
                    queryset = queryset.filter(status='approved')
        else:
            queryset = queryset.filter(status='approved')

        # 9. Ticket Availability
        if availability:
            availability = availability.strip().lower()
            if availability == 'available':
                queryset = queryset.filter(ticket_types__remaining_quantity__gt=0)
            elif availability == 'nearly_sold_out':
                queryset = queryset.filter(ticket_types__remaining_quantity__gt=0, ticket_types__remaining_quantity__lte=5)
            elif availability == 'sold_out':
                queryset = queryset.exclude(ticket_types__remaining_quantity__gt=0)

        # 10. Sorting
        if sort:
            sort = sort.strip().lower()
            if sort == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort == 'oldest':
                queryset = queryset.order_by('created_at')
            elif sort == 'date_asc':
                queryset = queryset.order_by('date')
            elif sort == 'date_desc':
                queryset = queryset.order_by('-date')
            elif sort == 'price_asc':
                queryset = queryset.annotate(min_tix_price=Min('ticket_types__price')).order_by('min_tix_price')
            elif sort == 'price_desc':
                queryset = queryset.annotate(max_tix_price=Max('ticket_types__price')).order_by('-max_tix_price')
            elif sort in ['popular', 'most_booked']:
                queryset = queryset.annotate(num_bookings=Count('bookings', filter=Q(bookings__status='paid'))).order_by('-num_bookings')
            elif sort == 'highest_rated':
                queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).order_by('-avg_rating')
        else:
            queryset = queryset.order_by('-date')

        return queryset.distinct()

    def perform_create(self, serializer):
        event = serializer.save(organizer=self.request.user, status='pending')
        
        from django.utils import timezone
        from events.models import TicketType
        
        naive_end = timezone.datetime.combine(event.end_date or event.date, timezone.datetime.max.time())
        sale_end = timezone.make_aware(naive_end) if timezone.is_naive(naive_end) else naive_end
        
        custom_passes = self.request.data.get('pass_categories')
        if custom_passes and isinstance(custom_passes, list) and len(custom_passes) > 0:
            for idx, p in enumerate(custom_passes):
                name = p.get('name', f'Pass Tier {idx+1}')
                try:
                    price = float(p.get('price', event.ticket_price))
                    qty = int(p.get('total_quantity', event.total_tickets))
                except (ValueError, TypeError):
                    price = float(event.ticket_price)
                    qty = int(event.total_tickets)
                
                desc = p.get('description', '')
                benefits = p.get('benefits', [])
                color = p.get('color', 'green' if idx == 0 else ('amber' if idx == 1 else 'purple'))
                
                TicketType.objects.create(
                    event=event,
                    name=name,
                    description=desc,
                    price=price,
                    total_quantity=qty,
                    remaining_quantity=qty,
                    max_per_user=10,
                    sale_start=timezone.now(),
                    sale_end=sale_end,
                    benefits=benefits,
                    color=color,
                    display_order=idx + 1,
                    status="active"
                )
            return

        base_price = float(event.ticket_price)
        total_qty = event.total_tickets

        # Default Fallback: General, VIP, Deluxe
        TicketType.objects.create(
            event=event,
            name="General Pass",
            description="Standard festival entry pass for event grounds and general zone access.",
            price=base_price,
            total_quantity=max(10, int(total_qty * 0.6)),
            remaining_quantity=max(10, int(total_qty * 0.6)),
            max_per_user=10,
            sale_start=timezone.now(),
            sale_end=sale_end,
            benefits=["Main Festival Ground Access", "General Parking Zone", "Food Court Access"],
            color="green",
            display_order=1,
            status="active"
        )

        TicketType.objects.create(
            event=event,
            name="VIP Pass",
            description="Fast-track VIP entry with prime viewing area near the main stage.",
            price=round(base_price * 2.5, 2),
            total_quantity=max(5, int(total_qty * 0.3)),
            remaining_quantity=max(5, int(total_qty * 0.3)),
            max_per_user=5,
            sale_start=timezone.now(),
            sale_end=sale_end,
            benefits=["Fast-Track VIP Entry Gate", "Prime Orchestra Zone Access", "Dedicated VIP Parking Pass"],
            color="amber",
            display_order=2,
            status="active"
        )

        TicketType.objects.create(
            event=event,
            name="Deluxe Pass",
            description="Premium luxury pass including stage-side lounge, complimentary food & drinks, and artiste photo-op.",
            price=round(base_price * 4.5, 2),
            total_quantity=max(2, int(total_qty * 0.1)),
            remaining_quantity=max(2, int(total_qty * 0.1)),
            max_per_user=5,
            sale_start=timezone.now(),
            sale_end=sale_end,
            benefits=["Stage-Side Reserved Lounge", "Complimentary Food & Drink Voucher", "Artiste Photo-Op Zone", "Valet Parking Included"],
            color="purple",
            display_order=3,
            status="active"
        )

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        is_admin = user and user.is_authenticated and (user.role in ['admin', 'staff'] or user.is_staff)
        if self.action in ['update', 'partial_update', 'destroy', 'resubmit']:
            if obj.organizer != user and not is_admin:
                self.permission_denied(request, message="You did not host this event.")
        if self.action == 'retrieve':
            if obj.status != 'approved':
                if not user or not user.is_authenticated:
                    self.permission_denied(request, message="This event is pending review.")
                elif obj.organizer != user and not is_admin:
                    self.permission_denied(request, message="This event is pending review.")

    @action(detail=True, methods=['get', 'post'], url_path='schedule')
    def schedule(self, request, pk=None):
        event = self.get_object()
        is_admin = request.user and request.user.is_authenticated and (request.user.role in ['admin', 'staff'] or request.user.is_staff)
        if request.method == 'GET':
            if event.status != 'approved' and event.organizer != request.user and not is_admin:
                return Response({"error": "Event is not public."}, status=status.HTTP_403_FORBIDDEN)
            schedules = event.schedules.filter(status='active').order_by('start_time')
            serializer = EventScheduleSerializer(schedules, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            # Only organizer of the event or admin can manage schedules
            if event.organizer != request.user and not is_admin:
                return Response({"error": "You cannot manage schedules for this event."}, status=status.HTTP_403_FORBIDDEN)
            serializer = EventScheduleSerializer(data=request.data, context={'event': event})
            serializer.is_valid(raise_exception=True)
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='tickets')
    def tickets(self, request, pk=None):
        event = self.get_object()
        if request.method == 'GET':
            is_multi_pass = event.category in ['Concert', 'Social / Garba']
            ticket_types = event.ticket_types.all()

            # If event is NOT a multi-pass category but has old multi-pass ticket types, clean them up
            if not is_multi_pass and ticket_types.filter(name__in=["General Pass", "VIP Pass", "Deluxe Pass"]).exists():
                ticket_types.delete()
                ticket_types = event.ticket_types.all()

            if not ticket_types.exists():
                from django.utils import timezone
                from events.models import TicketType
                
                naive_end = timezone.datetime.combine(event.date, timezone.datetime.max.time())
                sale_end = timezone.make_aware(naive_end) if timezone.is_naive(naive_end) else naive_end

                if is_multi_pass:
                    base_price = float(event.ticket_price)
                    total_qty = int(event.total_tickets)
                    TicketType.objects.bulk_create([
                        TicketType(
                            event=event,
                            name="General Pass",
                            description="Standard entry pass for ground and food court access.",
                            price=base_price,
                            total_quantity=max(10, int(total_qty * 0.6)),
                            remaining_quantity=max(10, int(total_qty * 0.6)),
                            max_per_user=10,
                            benefits=["Main Ground Access", "General Parking Zone", "Food Court Access"],
                            color="green",
                            display_order=1,
                            sale_start=timezone.now(),
                            sale_end=sale_end,
                            status="active"
                        ),
                        TicketType(
                            event=event,
                            name="VIP Pass",
                            description="Fast-track VIP entry with prime orchestra viewing zone.",
                            price=round(base_price * 2.5),
                            total_quantity=max(5, int(total_qty * 0.3)),
                            remaining_quantity=max(5, int(total_qty * 0.3)),
                            max_per_user=5,
                            benefits=["Fast-Track VIP Entry Gate", "Prime Orchestra Zone Access", "Dedicated VIP Parking Pass"],
                            color="amber",
                            display_order=2,
                            sale_start=timezone.now(),
                            sale_end=sale_end,
                            status="active"
                        ),
                        TicketType(
                            event=event,
                            name="Deluxe Pass",
                            description="Premium luxury pass including stage-side lounge and photo-op zone.",
                            price=round(base_price * 4.5),
                            total_quantity=max(2, int(total_qty * 0.1)),
                            remaining_quantity=max(2, int(total_qty * 0.1)),
                            max_per_user=5,
                            benefits=["Stage-Side Reserved Lounge", "Complimentary Food Voucher", "Artiste Photo-Op Zone"],
                            color="purple",
                            display_order=3,
                            sale_start=timezone.now(),
                            sale_end=sale_end,
                            status="active"
                        ),
                    ])
                else:
                    TicketType.objects.create(
                        event=event,
                        name=f"Standard Entry Pass",
                        description=f"Standard entry pass for {event.title}",
                        price=event.ticket_price,
                        total_quantity=event.total_tickets,
                        remaining_quantity=event.total_tickets,
                        max_per_user=10,
                        sale_start=timezone.now(),
                        sale_end=sale_end,
                        status="active"
                    )
                ticket_types = event.ticket_types.all()

            # If request user is customer/anonymous, only show active ticket types
            if not request.user or not request.user.is_authenticated or (request.user.role != 'organizer' and not request.user.is_staff):
                ticket_types = ticket_types.filter(status='active')
            serializer = TicketTypeSerializer(ticket_types, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            # Only organizer of the event or admin can create ticket types
            if event.organizer != request.user and not (request.user.role == 'admin' or request.user.is_staff):
                return Response({"error": "You cannot manage ticket categories for this event."}, status=status.HTTP_403_FORBIDDEN)
                
            data = request.data.copy()
            data['event'] = event.id
            serializer = TicketTypeSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        return self.list(request)

    @action(detail=False, methods=['get'], url_path='filter')
    def filter(self, request):
        return self.list(request)

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        queryset = Event.objects.filter(status='pending').order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='approved')
    def approved(self, request):
        queryset = Event.objects.filter(status='approved').order_by('-date')
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-events')
    def my_events(self, request):
        queryset = Event.objects.filter(organizer=request.user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        event = self.get_object()
        event.status = 'approved'
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.rejection_reason = None
        event.save()
        
        # Notify Organizer
        from interactions.models import Notification
        Notification.objects.create(
            user=event.organizer,
            title="Event Approved!",
            message=f"Your event '{event.title}' has been approved by Admin and is now live."
        )
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        event = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '').strip()
        if not rejection_reason:
            rejection_reason = "No reason provided."
            
        event.status = 'rejected'
        event.approved_by = None
        event.approved_at = None
        event.rejection_reason = rejection_reason
        event.save()
        
        # Notify Organizer
        from interactions.models import Notification
        Notification.objects.create(
            user=event.organizer,
            title="Event Rejected",
            message=f"Your event '{event.title}' was not approved. Reason: {rejection_reason}"
        )
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='resubmit')
    def resubmit(self, request, pk=None):
        event = self.get_object()
        event.status = 'pending'
        event.rejection_reason = None
        event.approved_by = None
        event.approved_at = None
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        venue_id = self.request.query_params.get('venue')
        event_id = self.request.query_params.get('event')
        
        queryset = Review.objects.all().order_by('-created_at')
        
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)
        elif event_id:
            queryset = queryset.filter(event_id=event_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework.decorators import action
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from events.models import EventBooking
from events.serializers import EventBookingSerializer

class EventBookingViewSet(viewsets.ModelViewSet):
    serializer_class = EventBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return EventBooking.objects.none()
        if user.role == 'admin' or user.is_staff:
            return EventBooking.objects.all().order_by('-created_at')
        if user.role == 'organizer':
            return EventBooking.objects.filter(event__organizer=user).order_by('-created_at')
        return EventBooking.objects.filter(customer=user).order_by('-created_at')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        is_admin = user and user.is_authenticated and (user.role in ['admin', 'staff'] or user.is_staff)
        is_customer = (obj.customer == user)
        is_organizer_host = (obj.event and obj.event.organizer == user)
        if not (is_admin or is_customer or is_organizer_host):
            self.permission_denied(request, message="You are not authorized to access this booking.")

    def perform_create(self, serializer):
        booking = serializer.save(customer=self.request.user)
        
        # Deduct from TicketType inventory
        ticket_type = booking.ticket_type
        if ticket_type:
            ticket_type.remaining_quantity -= booking.tickets_count
            ticket_type.save()
            
        # Deduct from general Event inventory (backward compatibility)
        event = booking.event
        event.available_tickets = max(0, event.available_tickets - booking.tickets_count)
        event.save()

    @action(detail=False, methods=['post'], url_path='book_external')
    def book_external(self, request):
        title = request.data.get('title')
        description = request.data.get('description', '')
        category = request.data.get('category', 'Festival')
        date_val = request.data.get('date')
        time_val = request.data.get('time', '18:00:00')
        ticket_price = float(request.data.get('ticket_price', 0))
        image = request.data.get('image', '')
        tickets_count = int(request.data.get('tickets_count', 1))

        if not title or not date_val:
            return Response({"error": "Title and Date are required to book external events."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch system admin or organizer host
        from django.contrib.auth import get_user_model
        User = get_user_model()
        host = User.objects.filter(role='admin').first() or User.objects.filter(role='organizer').first() or request.user

        # 2. Get or create local reference Event
        from events.models import Event
        event, created = Event.objects.get_or_create(
            title=title,
            date=date_val,
            defaults={
                'organizer': host,
                'description': description,
                'category': category,
                'time': time_val,
                'ticket_price': ticket_price,
                'total_tickets': 1000,
                'available_tickets': 1000,
                'images': [image] if image else []
            }
        )

        # 3. Double-check available inventory
        if event.available_tickets < tickets_count:
            return Response({"error": f"Only {event.available_tickets} tickets are available."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create EventBooking
        booking = EventBooking.objects.create(
            customer=request.user,
            event=event,
            tickets_count=tickets_count,
            total_price=tickets_count * event.ticket_price
        )

        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        booking = self.get_object()
        
        # Allow download if booking is paid OR has a completed payment record
        has_completed_payment = Payment.objects.filter(event_booking=booking, status='completed').exists()
        if booking.status != 'paid' and not has_completed_payment:
            return Response({"error": "Ticket PDF is only available after a successful payment."}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="ticket_{booking.id}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        
        # Draw ticket border
        p.setStrokeColorRGB(0.97, 0.27, 0.39) # #f84464 (BookMyShow pink accent)
        p.setLineWidth(3)
        p.rect(50, 320, 500, 450)
        
        # Header banner
        p.setFillColorRGB(0.97, 0.27, 0.39)
        p.rect(50, 710, 500, 60, fill=True)
        
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 20)
        p.drawString(220, 730, "EVENTSPHERE")

        # Ticket Info
        p.setFillColorRGB(0.12, 0.16, 0.23) # Dark Slate
        p.setFont("Helvetica-Bold", 16)
        p.drawString(80, 670, booking.event.title.upper())
        
        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 630, "DATE & TIME:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 630, f"{booking.event.date} at {booking.event.time}")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 600, "ATTENDEE:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 600, f"{booking.customer.first_name} {booking.customer.last_name}")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 570, "EMAIL:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 570, booking.customer.email)

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 540, "QUANTITY:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 540, f"{booking.tickets_count} Tickets")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 510, "TOTAL AMOUNT:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 510, f"INR {booking.total_price} (Paid)")

        # Print ticket type category
        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 480, "TICKET CLASS:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 480, f"{booking.ticket_type.name if booking.ticket_type else 'General'}")

        # Generate and draw QR Code image in-memory
        try:
            import io
            import qrcode
            from reportlab.lib.utils import ImageReader
            
            qr = qrcode.QRCode(version=1, box_size=3, border=1)
            qr.add_data(f"TICKET-ID:{booking.id}|EVENT:{booking.event.title}|QTY:{booking.tickets_count}|HASH:{booking.qr_code_hash}")
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            qr_buffer = io.BytesIO()
            qr_img.save(qr_buffer, "PNG")
            qr_buffer.seek(0)
            
            img_reader = ImageReader(qr_buffer)
            p.drawImage(img_reader, 420, 480, width=100, height=100)
        except Exception as qr_err:
            print("Failed to generate QR code for PDF:", qr_err)

        # Divider
        p.setStrokeColorRGB(0.8, 0.8, 0.8)
        p.setLineWidth(1)
        p.line(80, 450, 520, 450) # Shifted down because of new text line

        # Entry code footer
        p.setFillColorRGB(0.97, 0.27, 0.39)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(80, 420, "SECURE GATE ENTRY CODE:")
        p.setFillColorRGB(0.12, 0.16, 0.23)
        p.setFont("Courier", 10)
        p.drawString(80, 400, booking.qr_code_hash)
        
        p.setFont("Helvetica-Oblique", 9)
        p.setFillColorRGB(0.4, 0.4, 0.4)
        p.drawString(80, 375, "* Present this PDF Ticket or scan the QR Code on your portal dashboard to enter.")
        p.drawString(80, 360, f"* Secure QR Verification Code: {booking.qr_code_hash}")
        p.drawString(80, 345, "* Ticket is non-transferable and non-refundable.")

        p.showPage()
        p.save()
        return response

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        # Security check: only customer or admin can cancel
        if booking.customer != user and not (user.role == 'admin' or user.is_staff):
            return Response({"error": "You cannot cancel this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status == 'cancelled':
            return Response({"error": "This booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Process Refund if booking was paid
        was_paid = False
        matching_payment = Payment.objects.filter(event_booking=booking, status='completed').first()
        if matching_payment:
            matching_payment.status = 'refunded'
            matching_payment.save()
            was_paid = True
            
        # Restore ticket inventory (both general event count and specific TicketType count)
        ticket_type = booking.ticket_type
        if ticket_type:
            ticket_type.remaining_quantity += booking.tickets_count
            ticket_type.save()
            
        event = booking.event
        event.available_tickets += booking.tickets_count
        event.save()
            
        booking.status = 'cancelled'
        booking.save()
        
        # Notify Organizer
        from interactions.models import Notification
        Notification.objects.create(
            user=booking.event.organizer,
            title="Event Tickets Cancelled",
            message=f"A customer '{user.email}' cancelled {booking.tickets_count} tickets for your event '{booking.event.title}'." + 
                    (f" A refund of ₹{matching_payment.amount} was processed." if was_paid else "")
        )
        
        # Notify Customer
        Notification.objects.create(
            user=booking.customer,
            title="Ticket Cancellation & Refund",
            message=f"Your tickets for '{booking.event.title}' have been cancelled. " +
                    (f"A full refund of ₹{matching_payment.amount} has been initiated." if was_paid else "")
        )
        
        return Response({"message": "Booking cancelled successfully." + (" Refund initiated." if was_paid else "")}, status=status.HTTP_200_OK)

class TicketTypeViewSet(viewsets.ModelViewSet):
    serializer_class = TicketTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return TicketType.objects.all()
        # Organizers see ticket types for events they host
        return TicketType.objects.filter(event__organizer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        # Only event organizer or admin can modify ticket types
        if obj.event.organizer != user and not (user.role == 'admin' or user.is_staff):
            self.permission_denied(request, message="You do not own this event's listings.")

from events.services import fetch_live_events
from rest_framework.views import APIView

class LiveAhmedabadEventsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = fetch_live_events()
        return Response(data, status=status.HTTP_200_OK)

class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = ['Music', 'Sports', 'Workshops', 'Business', 'Technology', 'Cultural', 'Education', 'Food', 'Entertainment', 'Other']
        return Response(categories, status=status.HTTP_200_OK)

class CityListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cities = set(['Ahmedabad', 'Gandhinagar', 'Vadodara', 'Surat', 'Rajkot'])
        from venues.models import Venue
        for addr in Venue.objects.values_list('address', flat=True):
            for candidate in ['Ahmedabad', 'Gandhinagar', 'Vadodara', 'Surat', 'Rajkot', 'Mumbai', 'Delhi', 'Bangalore']:
                if candidate.lower() in addr.lower():
                    cities.add(candidate)
        return Response(sorted(list(cities)), status=status.HTTP_200_OK)

class EventScheduleViewSet(viewsets.ModelViewSet):
    queryset = EventSchedule.objects.all()
    serializer_class = EventScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action in ['update', 'partial_update']:
            context['event'] = self.get_object().event
        return context

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if obj.event.organizer != user and not (user.role == 'admin' or user.is_staff):
            self.permission_denied(request, message="You do not host this event.")
