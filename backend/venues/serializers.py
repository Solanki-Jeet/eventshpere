from rest_framework import serializers
from django.db.models import Q
from datetime import date
from venues.models import Venue, Booking, MaintenanceDay
from users.serializers import UserSerializer

class VenueSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Venue
        fields = ('id', 'owner', 'name', 'description', 'address', 'capacity', 'price_per_day', 'facilities', 'venue_type', 'images', 'is_approved', 'approval_status', 'rejection_reason', 'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'is_approved', 'approval_status', 'rejection_reason', 'created_at', 'updated_at')

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Capacity must be greater than zero.")
        return value

    def validate_price_per_day(self, value):
        if value < 0:
            raise serializers.ValidationError("Price per day cannot be negative.")
        return value

class BookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)
    is_paid = serializers.SerializerMethodField()
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ('id', 'customer', 'venue', 'venue_details', 'start_date', 'end_date', 'total_price', 'status', 'approved_by', 'approved_at', 'is_paid', 'created_at', 'updated_at')
        read_only_fields = ('id', 'customer', 'total_price', 'approved_by', 'approved_at', 'created_at', 'updated_at')

    def get_is_paid(self, obj):
        return obj.payments.filter(status='completed').exists()

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        venue = attrs.get('venue')

        # Skip date validations for partial updates (e.g. PATCH with only {status})
        if start_date is None or end_date is None or venue is None:
            return attrs

        # 1. Dates logical validation
        if start_date is not None and start_date < date.today():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})
        if start_date is not None and end_date is not None and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})

        # 2. Overlapping Booking Validation (Checks against Pending, Approved, and Paid bookings)
        if venue is not None and start_date is not None and end_date is not None:
            overlapping_bookings = Booking.objects.filter(
                venue=venue,
                status__in=['pending', 'approved', 'paid']
            ).filter(
                Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
            )

            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(pk=self.instance.pk)

            if overlapping_bookings.exists():
                conflict = overlapping_bookings.first()
                raise serializers.ValidationError({
                    "non_field_errors": f"This venue has an active booking or request from {conflict.start_date} to {conflict.end_date} (Status: {conflict.status.upper()}). Please choose different dates."
                })

            # 3. Overlapping Maintenance Days Validation
            overlapping_maintenance = MaintenanceDay.objects.filter(
                venue=venue
            ).filter(
                Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
            )

            if overlapping_maintenance.exists():
                conflict = overlapping_maintenance.first()
                raise serializers.ValidationError({
                    "non_field_errors": f"This venue is closed for maintenance from {conflict.start_date} to {conflict.end_date} (Reason: {conflict.reason}). Please choose different dates."
                })

        return attrs

    def create(self, validated_data):
        venue = validated_data['venue']
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        
        # Calculate total price automatically
        days = (end_date - start_date).days + 1
        total_price = days * venue.price_per_day
        
        validated_data['total_price'] = total_price
        return super().create(validated_data)

class MaintenanceDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceDay
        fields = ('id', 'venue', 'start_date', 'end_date', 'reason', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and start_date < date.today():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})
            
        return attrs
