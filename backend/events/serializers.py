from rest_framework import serializers
from datetime import date
from django.utils import timezone
from events.models import Event, Review, EventBooking, TicketType, EventSchedule
from users.serializers import UserSerializer
from venues.serializers import VenueSerializer

class EventScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventSchedule
        fields = ('id', 'event', 'title', 'description', 'start_time', 'end_time', 'speaker_name', 'venue_room', 'display_order', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'event', 'created_at', 'updated_at')

    def validate(self, data):
        # 1. End Time must be after Start Time
        start = data.get('start_time')
        end = data.get('end_time')
        if start and end and start >= end:
            raise serializers.ValidationError("End time must be strictly after start time.")

        event = self.context.get('event') or (self.instance.event if self.instance else None)
        if 'event' in data:
            event = data['event']

        if not event:
            raise serializers.ValidationError("Associated event is required.")

        # 2. Prevent duplicate titles within the same event
        title = data.get('title')
        if title:
            query = EventSchedule.objects.filter(event=event, title__iexact=title.strip())
            if self.instance:
                query = query.exclude(id=self.instance.id)
            if query.exists():
                raise serializers.ValidationError("A session with this title already exists for this event.")

        # 3. Ensure all sessions fall within the event's start and end times
        if event.time and start and start < event.time:
            raise serializers.ValidationError(f"Session start time ({start.strftime('%I:%M %p')}) cannot be before the event's start time ({event.time.strftime('%I:%M %p')}).")

        if event.end_time and end and end > event.end_time:
            raise serializers.ValidationError(f"Session end time ({end.strftime('%I:%M %p')}) cannot be after the event's end time ({event.end_time.strftime('%I:%M %p')}).")

        # 4. Prevent overlapping schedule items
        overlap_query = EventSchedule.objects.filter(
            event=event,
            status='active',
            start_time__lt=end,
            end_time__gt=start
        )
        if self.instance:
            overlap_query = overlap_query.exclude(id=self.instance.id)
        if overlap_query.exists():
            overlapping_item = overlap_query.first()
            raise serializers.ValidationError(
                f"This session overlaps with an existing session: '{overlapping_item.title}' ({overlapping_item.start_time.strftime('%I:%M %p')} - {overlapping_item.end_time.strftime('%I:%M %p')})."
            )

        return data

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)
    schedules = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'organizer', 'venue', 'venue_details', 'title', 'description', 'category', 'date', 'end_date', 'time', 'end_time', 'ticket_price', 'total_tickets', 'available_tickets', 'images', 'tags', 'schedules', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'created_at', 'updated_at')
        read_only_fields = ('id', 'organizer', 'available_tickets', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'created_at', 'updated_at')

    def get_schedules(self, obj):
        active_schedules = obj.schedules.filter(status='active').order_by('start_time')
        return EventScheduleSerializer(active_schedules, many=True).data

    def validate(self, data):
        start = data.get('time')
        end = data.get('end_time')
        if start and end and start >= end:
            raise serializers.ValidationError({"end_time": "Event end time must be after the start time."})
        
        start_date = data.get('date')
        end_date = data.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "Event end date cannot be before the start date."})

        return data

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Event date cannot be in the past.")
        return value

    def validate_total_tickets(self, value):
        if value <= 0:
            raise serializers.ValidationError("Total tickets count must be greater than zero.")
        return value

    def validate_ticket_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Ticket price cannot be negative.")
        return value

    def create(self, validated_data):
        # Set available tickets initially to total tickets
        validated_data['available_tickets'] = validated_data['total_tickets']
        validated_data['status'] = 'pending'  # Force status to pending on create
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # When an organizer updates their event, force the status back to 'pending' and clear validation data
        request = self.context.get('request')
        if request and request.user and request.user.role == 'organizer':
            validated_data['status'] = 'pending'
            validated_data['rejection_reason'] = None
            validated_data['approved_by'] = None
            validated_data['approved_at'] = None
        return super().update(instance, validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'venue', 'event', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value

    def validate(self, attrs):
        venue = attrs.get('venue')
        event = attrs.get('event')
        
        if not venue and not event:
            raise serializers.ValidationError("A review must be associated with either a venue or an event.")
        if venue and event:
            raise serializers.ValidationError("A review cannot be associated with both a venue and an event at the same time.")
            
        return attrs

class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketType
        fields = ('id', 'event', 'name', 'description', 'price', 'total_quantity', 'remaining_quantity', 'max_per_user', 'sale_start', 'sale_end', 'benefits', 'color', 'display_order', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'remaining_quantity', 'created_at', 'updated_at')

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_total_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Total quantity must be greater than zero.")
        return value

    def validate(self, attrs):
        sale_start = attrs.get('sale_start')
        sale_end = attrs.get('sale_end')
        
        if sale_start and sale_end and sale_end <= sale_start:
            raise serializers.ValidationError({"sale_end": "Sale end date must be after sale start date."})

        # Ensure duplicate ticket names are not created within the same event
        event = attrs.get('event')
        name = attrs.get('name')
        if event and name:
            qs = TicketType.objects.filter(event=event, name__iexact=name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"name": f"A ticket category named '{name}' already exists for this event."})

        return attrs

    def create(self, validated_data):
        # Set remaining_quantity to total_quantity initially
        validated_data['remaining_quantity'] = validated_data['total_quantity']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        total_quantity = validated_data.get('total_quantity')
        if total_quantity is not None:
            # Adjust remaining quantity based on the change in total
            difference = total_quantity - instance.total_quantity
            new_remaining = instance.remaining_quantity + difference
            if new_remaining < 0:
                raise serializers.ValidationError({"total_quantity": "Cannot decrease total quantity below currently booked/sold tickets."})
            validated_data['remaining_quantity'] = new_remaining
            
        return super().update(instance, validated_data)

class EventBookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    event_details = EventSerializer(source='event', read_only=True)
    ticket_type_details = TicketTypeSerializer(source='ticket_type', read_only=True)

    class Meta:
        model = EventBooking
        fields = ('id', 'customer', 'event', 'event_details', 'ticket_type', 'ticket_type_details', 'tickets_count', 'total_price', 'status', 'qr_code_hash', 'created_at', 'updated_at')
        read_only_fields = ('id', 'customer', 'total_price', 'status', 'qr_code_hash', 'created_at', 'updated_at')

    def validate(self, attrs):
        event = attrs.get('event')
        ticket_type = attrs.get('ticket_type')
        tickets_count = attrs.get('tickets_count')
        
        if tickets_count <= 0:
            raise serializers.ValidationError({"tickets_count": "Must book at least 1 ticket."})

        if ticket_type is None:
            raise serializers.ValidationError({"ticket_type": "Please select a ticket category."})

        # Verify that the selected ticket type belongs to the selected event
        if ticket_type.event != event:
            raise serializers.ValidationError({"ticket_type": "The selected ticket type does not belong to this event."})

        # Verify status is active
        if ticket_type.status != 'active':
            raise serializers.ValidationError({"ticket_type": "This ticket category is currently inactive."})

        # Verify sale dates are active
        now = timezone.now()
        if ticket_type.sale_start > now:
            raise serializers.ValidationError({"ticket_type": "Sales for this ticket type have not started yet."})
        if ticket_type.sale_end < now:
            raise serializers.ValidationError({"ticket_type": "Sales for this ticket type have ended."})

        # Verify max tickets per user
        if tickets_count > ticket_type.max_per_user:
            raise serializers.ValidationError({
                "tickets_count": f"You can purchase a maximum of {ticket_type.max_per_user} tickets of this category per order."
            })

        # Verify availability
        if ticket_type.remaining_quantity < tickets_count:
            raise serializers.ValidationError({
                "tickets_count": f"Only {ticket_type.remaining_quantity} tickets are available in the {ticket_type.name} category."
            })
            
        return attrs

    def create(self, validated_data):
        ticket_type = validated_data['ticket_type']
        tickets_count = validated_data['tickets_count']
        
        # Calculate price based on selected ticket type price
        validated_data['total_price'] = tickets_count * ticket_type.price
        return super().create(validated_data)
