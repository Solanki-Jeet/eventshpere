import datetime
from rest_framework import viewsets, permissions, status, filters, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.db.models import Q
from venues.models import Venue, Booking, MaintenanceDay
from venues.serializers import VenueSerializer, BookingSerializer, MaintenanceDaySerializer
from users.permissions import IsPlotOwner, IsAdmin
from interactions.models import Notification
from rest_framework.decorators import action
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from payments.models import Payment

class VenueViewSet(viewsets.ModelViewSet):
    serializer_class = VenueSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'address', 'description']

    def get_permissions(self):
        if self.action in ['create']:
            # Only plot owners can create venues
            permission_classes = [permissions.IsAuthenticated, IsPlotOwner | IsAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Must be authenticated and owner of plot or admin
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Anyone can browse approved venues
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        my_plots = self.request.query_params.get('my_plots', 'false') == 'true'
        
        # When fetching, updating, or deleting a specific venue by ID
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if user and user.is_authenticated:
                if user.role in ['admin', 'staff'] or user.is_staff:
                    return Venue.objects.all().order_by('-created_at')
                # Venue owners can access their own venues even if pending approval
                return Venue.objects.filter(Q(owner=user) | Q(is_approved=True)).order_by('-created_at')
            return Venue.objects.all().order_by('-created_at')

        # Admin can view everything in list
        if user and user.is_authenticated and (user.role == 'admin' or user.is_staff):
            return Venue.objects.all().order_by('-created_at')
            
        # Plot owners can view all their listed plots when my_plots=true
        if user and user.is_authenticated and user.role == 'plot_owner' and my_plots:
            return Venue.objects.filter(owner=user).order_by('-created_at')
            
        # Public list view only shows approved plots
        return Venue.objects.filter(is_approved=True).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if self.action in ['update', 'partial_update', 'destroy']:
            # Non-admins can only modify their own venues
            if obj.owner != request.user and not (request.user.role == 'admin' or request.user.is_staff):
                self.permission_denied(request, message="You do not own this venue.")

    @action(detail=True, methods=['get'], url_path='calendar', permission_classes=[permissions.AllowAny])
    def calendar(self, request, pk=None):
        venue = self.get_object()
        user = request.user
        
        # Fetch bookings that are not cancelled or rejected
        bookings = Booking.objects.filter(venue=venue).exclude(status__in=['cancelled', 'rejected'])
        maintenance = MaintenanceDay.objects.filter(venue=venue)
        
        events = []
        
        # Populate Bookings
        for b in bookings:
            is_owner_or_admin = user and user.is_authenticated and (user == venue.owner or user.role == 'admin' or user.is_staff)
            is_initiator = user and user.is_authenticated and user == b.customer
            
            title = "Venue Booked" if b.status in ['approved', 'paid'] else "Pending Request"
            color = "red" if b.status in ['approved', 'paid'] else "yellow"
            
            event_detail = {
                "id": f"booking_{b.id}",
                "title": title,
                "start": b.start_date.isoformat(),
                # FullCalendar end date is exclusive. To make it cover the end_date inclusive, we add 1 day.
                "end": (b.end_date + datetime.timedelta(days=1)).isoformat(),
                "color": color,
                "extendedProps": {
                    "type": "booking",
                    "booking_id": b.id,
                    "status": b.status,
                    "start_date": b.start_date.isoformat(),
                    "end_date": b.end_date.isoformat(),
                }
            }
            
            if is_owner_or_admin or is_initiator:
                # Safe fallback check for is_paid subqueries
                has_paid = b.payments.filter(status='completed').exists() if hasattr(b, 'payments') else False
                event_detail["extendedProps"].update({
                    "customer_email": b.customer.email,
                    "customer_name": f"{b.customer.first_name} {b.customer.last_name}",
                    "total_price": float(b.total_price),
                    "is_paid": has_paid
                })
                event_detail["title"] = f"{b.customer.first_name}'s Booking ({b.status.upper()})"
                
            events.append(event_detail)
            
        # Populate Maintenance Days
        for m in maintenance:
            events.append({
                "id": f"maintenance_{m.id}",
                "title": f"Maintenance: {m.reason}",
                "start": m.start_date.isoformat(),
                "end": (m.end_date + datetime.timedelta(days=1)).isoformat(),
                "color": "gray",
                "extendedProps": {
                    "type": "maintenance",
                    "maintenance_id": m.id,
                    "reason": m.reason,
                    "start_date": m.start_date.isoformat(),
                    "end_date": m.end_date.isoformat()
                }
            })
            
        return Response(events)

    @action(detail=True, methods=['post'], url_path='approve', permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        venue = self.get_object()
        if not (request.user.role == 'admin' or request.user.is_staff):
            return Response({"error": "Only administrators can approve venues."}, status=status.HTTP_403_FORBIDDEN)
        
        venue.approval_status = 'approved'
        venue.rejection_reason = None
        venue.save()
        
        # Create a notification for the owner
        from interactions.models import Notification
        Notification.objects.create(
            user=venue.owner,
            title="Venue Listing Approved",
            message=f"Your venue listing '{venue.name}' has been approved and is now public."
        )
        
        serializer = self.get_serializer(venue)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject', permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        venue = self.get_object()
        if not (request.user.role == 'admin' or request.user.is_staff):
            return Response({"error": "Only administrators can reject venues."}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        venue.approval_status = 'rejected'
        venue.rejection_reason = reason
        venue.save()
        
        # Create a notification for the owner
        from interactions.models import Notification
        Notification.objects.create(
            user=venue.owner,
            title="Venue Listing Rejected",
            message=f"Your venue listing '{venue.name}' has been rejected. Reason: {reason}"
        )
        
        serializer = self.get_serializer(venue)
        return Response(serializer.data)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admins see all bookings
        if user.role == 'admin' or user.is_staff:
            return Booking.objects.all().order_by('-created_at')
            
        # Plot owners see requests for their venues
        if user.role == 'plot_owner':
            return Booking.objects.filter(venue__owner=user).order_by('-created_at')
            
        # Customers & Organizers see bookings they initiated
        return Booking.objects.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        booking = serializer.save(customer=self.request.user)
        
        # Notify the Venue Owner
        Notification.objects.create(
            user=booking.venue.owner,
            title="New Booking Request",
            message=f"You have received a new booking request for your venue '{booking.venue.name}' from '{self.request.user.email}' from {booking.start_date} to {booking.end_date}."
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user = request.user
        new_status = request.data.get('status')

        # Enforce security updates:
        # Customers can only cancel their booking
        # Plot Owners can approve or reject booking
        if new_status:
            if new_status == 'cancelled':
                if instance.customer != user and not (user.role == 'admin' or user.is_staff):
                    return Response({"detail": "You cannot cancel this booking."}, status=status.HTTP_403_FORBIDDEN)
            elif new_status in ['approved', 'rejected']:
                if instance.venue.owner != user and not (user.role == 'admin' or user.is_staff):
                    return Response({"detail": "You do not own the venue for this booking request."}, status=status.HTTP_403_FORBIDDEN)

        # Before approving, explicitly check for date conflicts with existing approved/paid bookings
        if new_status == 'approved':
            conflicting = Booking.objects.filter(
                venue=instance.venue,
                status__in=['approved', 'paid']
            ).filter(
                Q(start_date__lte=instance.end_date) & Q(end_date__gte=instance.start_date)
            ).exclude(pk=instance.pk)

            if conflicting.exists():
                c = conflicting.first()
                return Response(
                    {"error": f"Cannot approve: '{instance.venue.name}' is already booked from {c.start_date} to {c.end_date}. Please reject this request or ask the customer to pick different dates."},
                    status=status.HTTP_409_CONFLICT
                )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        updated_booking = serializer.instance
        # Notify customer only when owner changes the status
        if new_status in ['approved', 'rejected']:
            Notification.objects.create(
                user=updated_booking.customer,
                title=f"Booking Request {updated_booking.status.capitalize()}",
                message=f"Your booking request for '{updated_booking.venue.name}' from {updated_booking.start_date} to {updated_booking.end_date} has been {updated_booking.status}."
            )

        return Response(serializer.data)


    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        # Security check: only customer or admin can cancel
        if booking.customer != user and not (user.role == 'admin' or user.is_staff):
            return Response({"error": "You cannot cancel this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status == 'cancelled':
            return Response({"error": "This booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Process Refund if booking was paid (status approved or paid)
        was_paid = False
        matching_payment = Payment.objects.filter(venue_booking=booking, status='completed').first()
        if matching_payment:
            matching_payment.status = 'refunded'
            matching_payment.save()
            was_paid = True
            
        booking.status = 'cancelled'
        booking.save()
        
        # Notify Plot Owner
        Notification.objects.create(
            user=booking.venue.owner,
            title="Venue Booking Cancelled",
            message=f"The booking for your venue '{booking.venue.name}' from {booking.start_date} to {booking.end_date} has been cancelled by the customer. " + 
                    (f"A payment refund of ₹{matching_payment.amount} was processed." if was_paid else "")
        )
        
        # Notify Customer
        Notification.objects.create(
            user=booking.customer,
            title="Venue Booking Cancelled",
            message=f"Your booking for '{booking.venue.name}' has been cancelled. " +
                    (f"A full refund of ₹{matching_payment.amount} has been initiated to your source account." if was_paid else "")
        )
        
        return Response({"message": "Booking cancelled successfully." + (" Refund initiated." if was_paid else "")}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        booking = self.get_object()
        
        # Check if booking is paid
        matching_payment = Payment.objects.filter(venue_booking=booking, status='completed').first()
        if not matching_payment:
            return Response({"error": "Invoice is only available for paid/confirmed venue bookings."}, status=status.HTTP_400_BAD_REQUEST)
            
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_venue_{booking.id}.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        
        # Draw ticket border
        p.setStrokeColorRGB(0.12, 0.56, 1.0) # #1e90ff (Blue accent for venues)
        p.setLineWidth(3)
        p.rect(50, 350, 500, 420)
        
        # Header banner
        p.setFillColorRGB(0.12, 0.56, 1.0)
        p.rect(50, 710, 500, 60, fill=True)
        
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 18)
        p.drawString(160, 730, "VENUE BOOKING INVOICE")

        # Info details
        p.setFillColorRGB(0.12, 0.16, 0.23) # Dark Slate
        p.setFont("Helvetica-Bold", 14)
        p.drawString(80, 670, booking.venue.name.upper())
        
        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 630, "RENTAL DATES:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 630, f"{booking.start_date} to {booking.end_date}")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 600, "CUSTOMER:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 600, f"{booking.customer.first_name} {booking.customer.last_name} ({booking.customer.email})")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 570, "VENUE OWNER:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 570, booking.venue.owner.email)

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 540, "CAPACITY:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 540, f"{booking.venue.capacity} Guests capacity")

        p.setFont("Helvetica-Bold", 11)
        p.drawString(80, 510, "AMOUNT PAID:")
        p.setFont("Helvetica", 11)
        p.drawString(180, 510, f"INR {booking.total_price} (Paid via {matching_payment.payment_method.upper()})")

        # Divider
        p.setStrokeColorRGB(0.8, 0.8, 0.8)
        p.setLineWidth(1)
        p.line(80, 470, 520, 470)

        # Footer terms
        p.setFillColorRGB(0.12, 0.56, 1.0)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(80, 440, "CONFIRMED TRANSACTION ID:")
        p.setFillColorRGB(0.12, 0.16, 0.23)
        p.setFont("Courier", 10)
        p.drawString(80, 420, matching_payment.transaction_id)
        
        p.setFont("Helvetica-Oblique", 9)
        p.setFillColorRGB(0.4, 0.4, 0.4)
        p.drawString(80, 380, "* This invoice acts as a security lock confirmation of dates reservation.")
        p.drawString(80, 365, "* Cancellations made under 48 hours are subject to owner approval.")

        p.showPage()
        p.save()
        return response

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        # Verify permissions: must be owner of venue or admin
        if booking.venue.owner != user and not (user.role == 'admin' or user.is_staff):
            return Response({"error": "You do not own the venue for this booking request."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status in ['approved', 'paid']:
            return Response({"error": "This booking is already approved or paid."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check overlapping bookings and maintenance
        conflicting = Booking.objects.filter(
            venue=booking.venue,
            status__in=['approved', 'paid']
        ).filter(
            Q(start_date__lte=booking.end_date) & Q(end_date__gte=booking.start_date)
        ).exclude(pk=booking.pk)
        
        if conflicting.exists():
            c = conflicting.first()
            return Response(
                {"error": f"Overlap conflict: Venue is already booked from {c.start_date} to {c.end_date}."},
                status=status.HTTP_409_CONFLICT
            )
            
        conflicting_maint = MaintenanceDay.objects.filter(
            venue=booking.venue
        ).filter(
            Q(start_date__lte=booking.end_date) & Q(end_date__gte=booking.start_date)
        )
        
        if conflicting_maint.exists():
            c = conflicting_maint.first()
            return Response(
                {"error": f"Overlap conflict: Venue is closed for maintenance from {c.start_date} to {c.end_date}."},
                status=status.HTTP_409_CONFLICT
            )

        from django.utils import timezone
        booking.status = 'approved'
        booking.approved_by = user
        booking.approved_at = timezone.now()
        booking.save()
        
        # Notify customer
        Notification.objects.create(
            user=booking.customer,
            title="Booking Request Approved",
            message=f"Your booking request for '{booking.venue.name}' from {booking.start_date} to {booking.end_date} has been approved. Please proceed to payment."
        )
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        # Verify permissions: must be owner of venue or admin
        if booking.venue.owner != user and not (user.role == 'admin' or user.is_staff):
            return Response({"error": "You do not own the venue for this booking request."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status in ['cancelled', 'rejected']:
            return Response({"error": "This booking is already cancelled or rejected."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'rejected'
        booking.approved_by = None
        booking.approved_at = None
        booking.save()
        
        # Notify customer
        Notification.objects.create(
            user=booking.customer,
            title="Booking Request Rejected",
            message=f"Your booking request for '{booking.venue.name}' from {booking.start_date} to {booking.end_date} was rejected."
        )
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

class MaintenanceDayViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return MaintenanceDay.objects.all().order_by('-created_at')
        # Venue owners see maintenance days for their venues
        return MaintenanceDay.objects.filter(venue__owner=user).order_by('-created_at')

    def perform_create(self, serializer):
        venue = serializer.validated_data['venue']
        user = self.request.user
        
        # Verify that the user owns the venue
        if venue.owner != user and not (user.role == 'admin' or user.is_staff):
            raise permissions.exceptions.PermissionDenied("You do not own this venue.")
            
        # Verify overlapping bookings/maintenance
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        conflicting_booking = Booking.objects.filter(
            venue=venue,
            status__in=['pending', 'approved', 'paid']
        ).filter(
            Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
        )
        
        if conflicting_booking.exists():
            c = conflicting_booking.first()
            raise serializers.ValidationError(
                {"error": f"Cannot add maintenance: There is an active booking/request from {c.start_date} to {c.end_date}."}
            )
            
        serializer.save()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if obj.venue.owner != user and not (user.role == 'admin' or user.is_staff):
            self.permission_denied(request, message="You do not own this venue.")

class ImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Save file to media folder
        filename = default_storage.save(f'uploads/{file_obj.name}', file_obj)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + filename)
        
        return Response({"url": file_url}, status=status.HTTP_201_CREATED)
