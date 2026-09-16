import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from events.models import Event, EventBooking
from venues.models import Venue

class EventRevenuePredictorService:
    @staticmethod
    def train_revenue_model():
        """
        Trains a Linear Regression model using historical event sales data.
        Returns model metrics and the trained model instance.
        """
        # 1. Load Data
        events = Event.objects.all().select_related('venue')
        bookings = EventBooking.objects.filter(status='paid')

        if not events.exists():
            return None, "No events found in database."

        # Convert to Pandas DataFrames
        events_data = []
        for e in events:
            events_data.append({
                'event_id': e.id,
                'ticket_price': float(e.ticket_price),
                'total_tickets': int(e.total_tickets),
                'category': e.category,
                'venue_capacity': int(e.venue.capacity) if e.venue else 0
            })
        events_df = pd.DataFrame(events_data)

        bookings_data = []
        for b in bookings:
            bookings_data.append({
                'event_id': b.event_id,
                'total_price': float(b.total_price)
            })
        
        if not bookings_data:
            return None, "No historical paid bookings found to train the model."

        bookings_df = pd.DataFrame(bookings_data)

        # Calculate actual revenue per event (Target Variable)
        revenue_df = bookings_df.groupby('event_id')['total_price'].sum().reset_index()
        revenue_df.rename(columns={'total_price': 'actual_revenue'}, inplace=True)

        # Merge features with target
        dataset = pd.merge(events_df, revenue_df, on='event_id', how='left')
        dataset['actual_revenue'] = dataset['actual_revenue'].fillna(0.0)

        # Check dataset size
        if len(dataset) < 5:
            return None, f"Insufficient training data. Only {len(dataset)} records available. Minimum 5 required."

        # One-hot encode category feature
        dataset_encoded = pd.get_dummies(dataset, columns=['category'], drop_first=True)

        # Features & Target Selection
        feature_cols = [col for col in dataset_encoded.columns if col not in ['event_id', 'actual_revenue']]
        X = dataset_encoded[feature_cols]
        y = dataset_encoded['actual_revenue']

        # Train/Test Split (Only if we have enough samples, else we train on all and report)
        if len(dataset) >= 8:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        else:
            X_train, X_test, y_train, y_test = X, X, y, y

        # Fit Linear Regression Model
        model = LinearRegression()
        model.fit(X_train, y_train)

        # Predictions & Metrics
        y_pred = model.predict(X_test)
        
        r2 = r2_score(y_test, y_pred) if len(y_test) > 1 else 1.0
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)

        return {
            "model": model,
            "feature_columns": feature_cols,
            "all_categories": events_df['category'].unique().tolist(),
            "metrics": {
                "r2_score": float(r2),
                "mae": float(mae),
                "mse": float(mse),
                "dataset_size": int(len(dataset))
            }
        }, None

    @classmethod
    def predict_revenue(cls, ticket_price, total_tickets, category, venue_id=None):
        """
        Predicts revenue for a new hypothetical event based on features.
        """
        # Fetch venue capacity if provided
        venue_capacity = 0
        if venue_id:
            try:
                venue = Venue.objects.get(id=venue_id)
                venue_capacity = venue.capacity
            except Venue.DoesNotExist:
                pass

        model_data, err = cls.train_revenue_model()
        if err:
            # Fallback heuristic calculation if data is insufficient for machine learning
            estimate = float(ticket_price) * float(total_tickets) * 0.70  # Estimate 70% occupancy
            return {
                "predicted_revenue": estimate,
                "is_estimate": True,
                "reason": f"Fallback estimate used: {err}"
            }

        # Build feature vector representing the input
        feature_cols = model_data["feature_columns"]
        input_data = {col: 0.0 for col in feature_cols}
        
        # Populate known features
        if 'ticket_price' in input_data:
            input_data['ticket_price'] = float(ticket_price)
        if 'total_tickets' in input_data:
            input_data['total_tickets'] = float(total_tickets)
        if 'venue_capacity' in input_data:
            input_data['venue_capacity'] = float(venue_capacity)

        # Populate one-hot category feature
        cat_col = f"category_{category}"
        if cat_col in input_data:
            input_data[cat_col] = 1.0

        input_df = pd.DataFrame([input_data])
        prediction = model_data["model"].predict(input_df)[0]

        # Prevent negative predictions
        prediction = max(0.0, float(prediction))

        return {
            "predicted_revenue": prediction,
            "is_estimate": True,
            "metrics": model_data["metrics"]
        }
