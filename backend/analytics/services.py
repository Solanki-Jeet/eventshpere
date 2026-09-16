import pandas as pd
import numpy as np
from django.contrib.auth import get_user_model
from events.models import Event, EventBooking, TicketType
from venues.models import Venue, Booking as VenueBooking
from payments.models import Payment

User = get_user_model()

class DjangoDataAnalyticsService:
    
    @staticmethod
    def clean_dataframe(df, fillna_values=None, numeric_columns=None, drop_duplicates_subset=None):
        """
        Generic data cleaning utility demonstrating:
        1. Duplicate detection and removal (drop_duplicates)
        2. Missing-value handling (fillna)
        3. Data type conversion (astype / to_numeric)
        Operates on a deep copy of the DataFrame to protect original DB queryset formats.
        """
        if df.empty:
            return df
        
        # Deep Copy to prevent mutating the original DataFrame
        cleaned_df = df.copy(deep=True)
        
        # 1. Duplicate detection & removal
        if drop_duplicates_subset:
            # Detect duplicated rows count
            duplicate_mask = cleaned_df.duplicated(subset=drop_duplicates_subset, keep='first')
            num_duplicates = duplicate_mask.sum()
            if num_duplicates > 0:
                cleaned_df = cleaned_df.drop_duplicates(subset=drop_duplicates_subset, keep='first')
                
        # 2. Missing-value handling
        if fillna_values:
            for col, val in fillna_values.items():
                if col in cleaned_df.columns:
                    cleaned_df[col] = cleaned_df[col].fillna(val)
                    
        # 3. Data type conversion
        if numeric_columns:
            for col in numeric_columns:
                if col in cleaned_df.columns:
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').fillna(0.0)
                    
        return cleaned_df

    @classmethod
    def get_users_df(cls):
        """Retrieve User data as a cleaned Pandas DataFrame."""
        queryset = User.objects.all().values(
            'id', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'date_joined'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'date_joined'])
        
        # Demonstration of missing-value handling for names and duplicates removal
        fillna_vals = {'first_name': 'Unknown', 'last_name': ''}
        return cls.clean_dataframe(df, fillna_values=fillna_vals, drop_duplicates_subset=['email'])

    @classmethod
    def get_events_df(cls):
        """Retrieve Event data as a cleaned Pandas DataFrame with date transformation."""
        queryset = Event.objects.all().values(
            'id', 'organizer_id', 'venue_id', 'title', 'category', 'date', 'ticket_price', 'total_tickets', 'available_tickets', 'status'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'organizer_id', 'venue_id', 'title', 'category', 'date', 'ticket_price', 'total_tickets', 'available_tickets', 'status'])
        
        # Type Conversion
        df = cls.clean_dataframe(df, numeric_columns=['ticket_price', 'total_tickets', 'available_tickets'])
        # Date Transformation
        df['date'] = pd.to_datetime(df['date'])
        df['event_weekday'] = df['date'].dt.day_name()
        return df

    @classmethod
    def get_ticket_types_df(cls):
        """Retrieve TicketType data as a cleaned Pandas DataFrame."""
        queryset = TicketType.objects.all().values(
            'id', 'event_id', 'name', 'price', 'total_quantity', 'remaining_quantity', 'status'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'event_id', 'name', 'price', 'total_quantity', 'remaining_quantity', 'status'])
        return cls.clean_dataframe(df, numeric_columns=['price', 'total_quantity', 'remaining_quantity'])

    @classmethod
    def get_event_bookings_df(cls):
        """Retrieve EventBooking data as a cleaned Pandas DataFrame."""
        queryset = EventBooking.objects.all().values(
            'id', 'customer_id', 'event_id', 'ticket_type_id', 'tickets_count', 'total_price', 'status', 'created_at'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'customer_id', 'event_id', 'ticket_type_id', 'tickets_count', 'total_price', 'status', 'created_at'])
        
        # Type Conversion and Duplicates detection
        df = cls.clean_dataframe(df, numeric_columns=['tickets_count', 'total_price'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        return df

    @classmethod
    def get_venues_df(cls):
        """Retrieve Venue data as a cleaned Pandas DataFrame."""
        queryset = Venue.objects.all().values(
            'id', 'owner_id', 'name', 'address', 'capacity', 'price_per_day', 'venue_type', 'approval_status'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'owner_id', 'name', 'address', 'capacity', 'price_per_day', 'venue_type', 'approval_status'])
        return cls.clean_dataframe(df, numeric_columns=['capacity', 'price_per_day'])

    @classmethod
    def get_venue_bookings_df(cls):
        """Retrieve VenueBooking data as a cleaned Pandas DataFrame."""
        queryset = VenueBooking.objects.all().values(
            'id', 'customer_id', 'venue_id', 'start_date', 'end_date', 'total_price', 'status', 'created_at'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'customer_id', 'venue_id', 'start_date', 'end_date', 'total_price', 'status', 'created_at'])
        
        df = cls.clean_dataframe(df, numeric_columns=['total_price'])
        df['start_date'] = pd.to_datetime(df['start_date'])
        df['end_date'] = pd.to_datetime(df['end_date'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        return df

    @classmethod
    def get_payments_df(cls):
        """Retrieve Payment data as a cleaned Pandas DataFrame."""
        queryset = Payment.objects.all().values(
            'id', 'booking_type', 'event_booking_id', 'venue_booking_id', 'amount', 'status', 'created_at'
        )
        df = pd.DataFrame(list(queryset))
        if df.empty:
            return pd.DataFrame(columns=['id', 'booking_type', 'event_booking_id', 'venue_booking_id', 'amount', 'status', 'created_at'])
        
        df = cls.clean_dataframe(df, numeric_columns=['amount'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        return df

    def get_event_revenue_analysis(self):
        """Analyzes event bookings, tickets, and revenues using merge and groupby aggregation."""
        bookings_df = self.get_event_bookings_df()
        events_df = self.get_events_df()

        if bookings_df.empty or events_df.empty:
            return {
                "total_tickets_sold": 0,
                "total_event_revenue": 0.0,
                "average_tickets_per_booking": 0.0,
                "revenue_by_event": {}
            }

        # Filtering: paid bookings only
        paid_bookings = bookings_df[bookings_df['status'] == 'paid']

        if paid_bookings.empty:
            return {
                "total_tickets_sold": 0,
                "total_event_revenue": 0.0,
                "average_tickets_per_booking": 0.0,
                "revenue_by_event": {}
            }

        # Relational Merges (merge)
        merged = pd.merge(paid_bookings, events_df, left_on='event_id', right_on='id', suffixes=('_booking', '_event'))

        # Groupby and Aggregation (groupby / sum / mean)
        event_group = merged.groupby('title').agg(
            total_tickets_sold=('tickets_count', 'sum'),
            total_revenue=('total_price', 'sum'),
            average_booking_price=('total_price', 'mean'),
            bookings_count=('id_booking', 'count')
        ).reset_index()

        # Sorting
        event_group_sorted = event_group.sort_values(by='total_revenue', ascending=False)

        return {
            "total_tickets_sold": int(paid_bookings['tickets_count'].sum()),
            "total_event_revenue": float(paid_bookings['total_price'].sum()),
            "average_tickets_per_booking": float(paid_bookings['tickets_count'].mean()),
            "revenue_by_event": event_group_sorted.to_dict(orient='records')
        }

    def get_venue_utilization_analysis(self):
        """Analyzes venue booking occupancy rates and income statistics."""
        bookings_df = self.get_venue_bookings_df()
        venues_df = self.get_venues_df()

        if bookings_df.empty or venues_df.empty:
            return {
                "total_rental_revenue": 0.0,
                "average_booking_days": 0.0,
                "revenue_by_venue": []
            }

        paid_venue_bookings = bookings_df[bookings_df['status'].isin(['paid', 'approved', 'confirmed'])]

        if paid_venue_bookings.empty:
            return {
                "total_rental_revenue": 0.0,
                "average_booking_days": 0.0,
                "revenue_by_venue": []
            }

        # Date Transformation and leads calculation
        durations = (paid_venue_bookings['end_date'] - paid_venue_bookings['start_date']).dt.days + 1
        paid_venue_bookings = paid_venue_bookings.copy()
        paid_venue_bookings['booking_days'] = durations

        # Relational Merges (merge)
        merged = pd.merge(paid_venue_bookings, venues_df, left_on='venue_id', right_on='id')

        # Groupby and Aggregation
        venue_group = merged.groupby('name').agg(
            total_rental_revenue=('total_price', 'sum'),
            average_booking_days=('booking_days', 'mean'),
            total_bookings_count=('id_x', 'count')
        ).reset_index()

        return {
            "total_rental_revenue": float(paid_venue_bookings['total_price'].sum()),
            "average_booking_days": float(paid_venue_bookings['booking_days'].mean()),
            "revenue_by_venue": venue_group.to_dict(orient='records')
        }

    def get_customer_spending_demographics(self):
        """Analyzes spending demographics by merging User profiles with ticket purchases."""
        users_df = self.get_users_df()
        bookings_df = self.get_event_bookings_df()

        if users_df.empty or bookings_df.empty:
            return []

        # Filtering: customer roles
        customers = users_df[users_df['role'] == 'customer']
        
        merged = pd.merge(bookings_df[bookings_df['status'] == 'paid'], customers, left_on='customer_id', right_on='id')

        if merged.empty:
            return []

        # Groupby and Aggregation
        spending_group = merged.groupby('email').agg(
            total_spent=('total_price', 'sum'),
            average_spent_per_booking=('total_price', 'mean'),
            total_tickets_bought=('tickets_count', 'sum'),
            transaction_count=('id_x', 'count')
        ).reset_index()

        spending_group_sorted = spending_group.sort_values(by='total_spent', ascending=False)
        return spending_group_sorted.to_dict(orient='records')

    def get_payment_transaction_statistics(self):
        """Applies NumPy and Pandas methods for calculating detailed financial statistics and correlations."""
        payments_df = self.get_payments_df()
        completed_payments = payments_df[payments_df['status'] == 'completed']

        if completed_payments.empty:
            return {
                "count": 0,
                "sum": 0.0,
                "mean": 0.0,
                "std": 0.0,
                "median": 0.0,
                "min": 0.0,
                "max": 0.0,
                "correlation_amount_day": 0.0
            }

        # Descriptive Statistics with NumPy
        amounts = np.array(completed_payments['amount'], dtype=np.float64)
        
        # Calculate booking lead day weekday index for correlation demonstration
        completed_payments = completed_payments.copy()
        completed_payments['weekday_index'] = completed_payments['created_at'].dt.weekday
        
        # Correlation Calculation (correlation)
        corr_val = 0.0
        if len(completed_payments) > 1:
            corr_val = completed_payments['amount'].corr(completed_payments['weekday_index'])
            if np.isnan(corr_val):
                corr_val = 0.0

        return {
            "count": int(len(amounts)),
            "sum": float(np.sum(amounts)),
            "mean": float(np.mean(amounts)),
            "std": float(np.std(amounts)) if len(amounts) > 1 else 0.0,
            "median": float(np.median(amounts)),
            "min": float(np.min(amounts)),
            "max": float(np.max(amounts)),
            "correlation_amount_day": float(corr_val)
        }
