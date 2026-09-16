import os
import uuid
import razorpay
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from payments.models import Coupon, Payment
from events.models import Event, EventBooking
from venues.models import Booking
from interactions.models import Notification

# Initialize Razorpay Client dynamically
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')

class ValidateCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({"valid": False, "error": "Coupon code is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(code__iexact=code)
            if coupon.is_valid():
                return Response({
                    "valid": True,
                    "discount_percent": coupon.discount_percent,
                    "code": coupon.code
                }, status=status.HTTP_200_OK)
            else:
                return Response({"valid": False, "error": "This coupon has expired or is inactive."}, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({"valid": False, "error": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST)

class CreatePaymentOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_type = request.data.get('booking_type') # 'event' or 'venue'
        booking_id = request.data.get('booking_id')
        coupon_code = request.data.get('coupon_code')
        
        if booking_type not in ['event', 'venue'] or not booking_id:
            return Response({"error": "Invalid payload parameters."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch correct booking
        amount = 0
        event_booking = None
        venue_booking = None
        target_event = None
        target_venue = None
        
        if booking_type == 'event':
            event_booking = get_object_or_404(EventBooking, pk=booking_id, customer=request.user)
            if event_booking.status not in ['pending']:
                return Response({"error": "This booking has already been paid or cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            target_event = event_booking.event
            
            # Guard against duplicate pending payment orders
            if Payment.objects.filter(event_booking=event_booking, status='pending').exists():
                existing = Payment.objects.filter(event_booking=event_booking, status='pending').latest('created_at')
                return Response({
                    "order_id": existing.razorpay_order_id or existing.transaction_id,
                    "amount": float(existing.amount),
                    "currency": existing.currency,
                    "key_id": RAZORPAY_KEY_ID or 'rzp_test_eventsphere2026',
                    "is_simulated": (existing.razorpay_order_id or existing.transaction_id).startswith('order_sim_')
                }, status=status.HTTP_200_OK)
            amount = event_booking.total_price
        else:
            venue_booking = get_object_or_404(Booking, pk=booking_id, customer=request.user)
            if venue_booking.status not in ['approved']:
                return Response({"error": "Venue booking must be approved by the plot owner before payment."}, status=status.HTTP_400_BAD_REQUEST)
            target_venue = venue_booking.venue
            
            # Guard against duplicate pending payment orders
            if Payment.objects.filter(venue_booking=venue_booking, status='pending').exists():
                existing = Payment.objects.filter(venue_booking=venue_booking, status='pending').latest('created_at')
                return Response({
                    "order_id": existing.razorpay_order_id or existing.transaction_id,
                    "amount": float(existing.amount),
                    "currency": existing.currency,
                    "key_id": RAZORPAY_KEY_ID or 'rzp_test_eventsphere2026',
                    "is_simulated": (existing.razorpay_order_id or existing.transaction_id).startswith('order_sim_')
                }, status=status.HTTP_200_OK)
            amount = venue_booking.total_price

        # 2. Check Coupon Discount
        applied_coupon = None
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                if coupon.is_valid():
                    discount = (amount * coupon.discount_percent) / 100
                    amount = amount - discount
                    applied_coupon = coupon
            except Coupon.DoesNotExist:
                pass # Fail silently or skip coupon
                
        # 3. Create payment record & Razorpay Order
        is_simulated = True
        order_id = f"order_sim_{uuid.uuid4().hex[:12]}"
        
        if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
            try:
                client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                order_amount = int(amount * 100) # Razorpay expects amount in paise
                order_currency = 'INR'
                order_receipt = f'rcpt_{booking_type}_{booking_id}'
                
                razorpay_order = client.order.create(data={
                    "amount": order_amount,
                    "currency": order_currency,
                    "receipt": order_receipt,
                    "payment_capture": 1
                })
                order_id = razorpay_order['id']
                is_simulated = False
            except Exception as e:
                print(f"Failed to connect to Razorpay: {e}. Falling back to sandbox test mode.")
                
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            event=target_event,
            venue=target_venue,
            booking_type=booking_type,
            event_booking=event_booking,
            venue_booking=venue_booking,
            amount=amount,
            currency='INR',
            transaction_id=order_id,
            razorpay_order_id=order_id,
            status='pending',
            coupon=applied_coupon,
            payment_method='razorpay'
        )
        
        return Response({
            "order_id": order_id,
            "amount": float(amount),
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID or 'rzp_test_eventsphere2026',
            "is_simulated": is_simulated
        }, status=status.HTTP_201_CREATED)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        status_payload = request.data.get('status', 'completed')
        
        if not order_id:
            return Response({"error": "Order ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        payment = Payment.objects.filter(
            models.Q(transaction_id=order_id) | models.Q(razorpay_order_id=order_id)
        ).first()
        
        if not payment:
            return Response({"error": "Payment order record not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify Razorpay Signature
        is_valid = False
        if order_id.startswith('order_sim_'):
            is_valid = (status_payload == 'completed')
        else:
            if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
                try:
                    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                    params_dict = {
                        'razorpay_order_id': order_id,
                        'razorpay_payment_id': payment_id,
                        'razorpay_signature': signature
                    }
                    client.utility.verify_payment_signature(params_dict)
                    is_valid = True
                except Exception as e:
                    print(f"Signature Verification Failed: {e}")
                    is_valid = False
            else:
                # Test Mode fallback acceptance when signature is provided
                is_valid = bool(payment_id and signature) or (status_payload == 'completed')
                    
        if is_valid:
            # 1. Update Payment Record
            payment.status = 'completed'
            payment.payment_id = payment_id or f"pay_sim_{uuid.uuid4().hex[:12]}"
            payment.razorpay_payment_id = payment.payment_id
            payment.razorpay_signature = signature or f"sig_sim_{uuid.uuid4().hex[:16]}"
            payment.payment_method = request.data.get('payment_method', 'razorpay')
            if not payment.user:
                payment.user = request.user
            payment.save()
            
            # 2. Update Booking Status
            if payment.booking_type == 'event':
                booking = payment.event_booking
                if booking:
                    booking.status = 'paid'
                    booking.save()
                    
                    Notification.objects.create(
                        user=booking.customer,
                        title="Tickets Booked Successfully!",
                        message=f"Your payment for '{booking.event.title}' is confirmed! Razorpay ID: {payment.payment_id}"
                    )
            else:
                booking = payment.venue_booking
                if booking:
                    booking.status = 'paid'
                    booking.save()
                    
                    Notification.objects.create(
                        user=booking.customer,
                        title="Venue Rental Confirmed!",
                        message=f"Your payment of ₹{payment.amount} for venue '{booking.venue.name}' is confirmed! Razorpay ID: {payment.payment_id}"
                    )
                
            return Response({
                "message": "Payment verified successfully!",
                "payment_id": payment.payment_id,
                "order_id": payment.razorpay_order_id or payment.transaction_id,
                "status": "completed"
            }, status=status.HTTP_200_OK)
        else:
            payment.status = 'failed'
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.save()
            return Response({"error": "Payment verification failed. Invalid transaction signature."}, status=status.HTTP_400_BAD_REQUEST)

class PaymentHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip()
        
        if user.role == 'admin' or user.is_staff:
            queryset = Payment.objects.all().select_related('user', 'event', 'venue', 'event_booking', 'venue_booking').order_by('-created_at')
        elif user.role == 'organizer':
            queryset = Payment.objects.filter(
                models.Q(event__organizer=user) | 
                models.Q(event_booking__event__organizer=user) | 
                models.Q(venue__owner=user)
            ).distinct().select_related('user', 'event', 'venue', 'event_booking', 'venue_booking').order_by('-created_at')
        else:
            queryset = Payment.objects.filter(
                models.Q(user=user) | 
                models.Q(event_booking__customer=user) | 
                models.Q(venue_booking__customer=user)
            ).distinct().select_related('user', 'event', 'venue', 'event_booking', 'venue_booking').order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        data = []
        for p in queryset:
            booking_name = "N/A"
            if p.user and hasattr(p.user, 'get_full_name'):
                customer_name = p.user.get_full_name()
            elif p.user:
                customer_name = p.user.email.split('@')[0]
            else:
                customer_name = "Customer"
            customer_email = p.user.email if p.user else ""

            if p.booking_type == 'event' and p.event_booking and p.event_booking.event:
                booking_name = p.event_booking.event.title
                if not customer_email and p.event_booking.customer:
                    customer_email = p.event_booking.customer.email
            elif p.booking_type == 'venue' and p.venue_booking and p.venue_booking.venue:
                booking_name = p.venue_booking.venue.name
                if not customer_email and p.venue_booking.customer:
                    customer_email = p.venue_booking.customer.email

            if search:
                s_lower = search.lower()
                if (s_lower not in booking_name.lower() and 
                    s_lower not in (p.transaction_id or '').lower() and 
                    s_lower not in (p.payment_id or '').lower() and
                    s_lower not in customer_email.lower()):
                    continue

            data.append({
                "id": p.id,
                "booking_type": p.booking_type,
                "booking_id": p.event_booking_id if p.booking_type == 'event' else p.venue_booking_id,
                "booking_name": booking_name,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "amount": float(p.amount) if p.amount is not None else 0.0,
                "currency": p.currency or "INR",
                "transaction_id": p.razorpay_order_id or p.transaction_id or '',
                "razorpay_order_id": p.razorpay_order_id or p.transaction_id or '',
                "razorpay_payment_id": p.razorpay_payment_id or p.payment_id or '',
                "razorpay_signature": p.razorpay_signature or '',
                "status": p.status or 'pending',
                "payment_method": p.payment_method or 'razorpay',
                "coupon_code": p.coupon.code if p.coupon else None,
                "date": p.created_at.strftime('%Y-%m-%d %H:%M') if p.created_at else ''
            })
        return Response(data, status=status.HTTP_200_OK)

class PaymentReceiptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, pk=payment_id)
        
        # Security check: User must own payment, be event/venue owner, or admin
        user = request.user
        is_owner = (payment.user == user) or (payment.event_booking and payment.event_booking.customer == user) or (payment.venue_booking and payment.venue_booking.customer == user)
        is_provider = (payment.event and payment.event.organizer == user) or (payment.venue and payment.venue.owner == user) or (payment.event_booking and payment.event_booking.event and payment.event_booking.event.organizer == user)
        is_admin = (user.role == 'admin' or user.is_staff)

        if not (is_owner or is_provider or is_admin):
            return Response({"error": "Unauthorized to view this payment receipt."}, status=status.HTTP_403_FORBIDDEN)

        booking_name = "N/A"
        booking_details = {}
        
        if payment.booking_type == 'event' and payment.event_booking:
            eb = payment.event_booking
            booking_name = eb.event.title if eb.event else "Event Ticket"
            booking_details = {
                "event_title": eb.event.title if eb.event else "",
                "category": eb.event.category if eb.event else "",
                "tickets_count": eb.tickets_count,
                "ticket_price": float(eb.event.ticket_price) if eb.event and eb.event.ticket_price else 0,
                "event_date": str(eb.event.date) if eb.event and eb.event.date else "",
                "location": eb.event.venue.name if eb.event and eb.event.venue else "Online/Venue"
            }
        elif payment.booking_type == 'venue' and payment.venue_booking:
            vb = payment.venue_booking
            booking_name = vb.venue.name if vb.venue else "Venue Rental"
            booking_details = {
                "venue_name": vb.venue.name if vb.venue else "",
                "address": vb.venue.address if vb.venue else "",
                "start_date": str(vb.start_date) if vb.start_date else "",
                "end_date": str(vb.end_date) if vb.end_date else "",
                "price_per_day": float(vb.venue.price_per_day) if vb.venue and vb.venue.price_per_day else 0
            }

        customer_user = payment.user or (payment.event_booking.customer if payment.event_booking else None) or (payment.venue_booking.customer if payment.venue_booking else None)

        if customer_user and hasattr(customer_user, 'get_full_name'):
            customer_name = customer_user.get_full_name()
        elif customer_user:
            customer_name = customer_user.email.split('@')[0]
        else:
            customer_name = "Customer"

        receipt_data = {
            "receipt_id": f"REC-{payment.id:06d}",
            "payment_id": payment.id,
            "razorpay_order_id": payment.razorpay_order_id or payment.transaction_id or '',
            "razorpay_payment_id": payment.razorpay_payment_id or payment.payment_id or '',
            "razorpay_signature": payment.razorpay_signature or '',
            "booking_type": payment.booking_type,
            "booking_name": booking_name,
            "booking_details": booking_details,
            "amount": float(payment.amount) if payment.amount is not None else 0.0,
            "currency": payment.currency or "INR",
            "payment_method": payment.payment_method or 'razorpay',
            "status": payment.status or 'completed',
            "coupon_code": payment.coupon.code if payment.coupon else None,
            "customer_name": customer_name,
            "customer_email": customer_user.email if customer_user else "",
            "date": payment.created_at.strftime('%B %d, %Y - %I:%M %p') if payment.created_at else ""
        }
        
        return Response(receipt_data, status=status.HTTP_200_OK)
