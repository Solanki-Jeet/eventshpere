import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from venues.models import Venue
from events.models import Event

User = get_user_model()

def seed():
    print("Seeding database...")
    
    # 1. Create Users
    users_data = [
        {"email": "customer@example.com", "role": "customer", "first_name": "Amit", "last_name": "Patel"},
        {"email": "organizer@example.com", "role": "organizer", "first_name": "Raj", "last_name": "Shah"},
        {"email": "plotowner@example.com", "role": "plot_owner", "first_name": "Vikram", "last_name": "Mehta"},
        {"email": "admin@example.com", "role": "admin", "first_name": "Super", "last_name": "Admin", "is_staff": True, "is_superuser": True},
    ]
    
    users = {}
    for u_data in users_data:
        email = u_data["email"]
        role = u_data["role"]
        is_staff = u_data.get("is_staff", False)
        is_superuser = u_data.get("is_superuser", False)
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": u_data["first_name"],
                "last_name": u_data["last_name"],
                "role": role,
                "is_email_verified": True,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            }
        )
        if created:
            user.set_password("password123")
            user.save()
            print(f"Created user: {email} with password 'password123' ({role})")
        else:
            print(f"User {email} already exists.")
        users[role] = user

    # 2. Create Venues
    plot_owner = users["plot_owner"]
    venues_data = [
        {
            "name": "Sabarmati Riverfront Lawns",
            "description": "Premium open-air lawn perfect for wedding functions, concerts, and cultural gatherings. Beautiful view of the Sabarmati riverfront.",
            "address": "Riverfront West, Near Ashram Road, Ahmedabad",
            "capacity": 2000,
            "price_per_day": 150000.00,
            "facilities": ["Parking", "Power Backup", "Catering Space", "Security"],
            "images": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"],
            "is_approved": True
        },
        {
            "name": "Sindhu Bhavan Convention Centre",
            "description": "Luxurious indoor banquet hall and outdoor lawn located in the premium corporate hub of Ahmedabad.",
            "address": "Sindhu Bhavan Road, Bodakdev, Ahmedabad",
            "capacity": 1000,
            "price_per_day": 120000.00,
            "facilities": ["Air Conditioning", "Valet Parking", "Stage Setup", "Bridal Rooms"],
            "images": ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80"],
            "is_approved": True
        },
        {
            "name": "SG Highway Exhibition Ground",
            "description": "Massive exhibition ground suitable for trade fairs, auto expos, and large-scale Navratri Garba festivals.",
            "address": "Near Gota Flyover, SG Highway, Ahmedabad",
            "capacity": 8000,
            "price_per_day": 250000.00,
            "facilities": ["Large Parking", "Vip Lounge", "Multiple Entry Gates", "Water Supply"],
            "images": ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"],
            "is_approved": True
        }
    ]

    venues = []
    for v_data in venues_data:
        venue, created = Venue.objects.get_or_create(
            name=v_data["name"],
            owner=plot_owner,
            defaults={
                "description": v_data["description"],
                "address": v_data["address"],
                "capacity": v_data["capacity"],
                "price_per_day": v_data["price_per_day"],
                "facilities": v_data["facilities"],
                "images": v_data["images"],
                "is_approved": v_data["is_approved"]
            }
        )
        if created:
            print(f"Created venue: {venue.name}")
        else:
            print(f"Venue {venue.name} already exists.")
        venues.append(venue)

    # 3. Create Events
    organizer = users["organizer"]
    events_data = [
        {
            "title": "Ahmedabad Tech Startup Summit 2026",
            "description": "Join the biggest startup event of Ahmedabad, featuring top VC panel discussions, pitch competitions, and developer workshops.",
            "category": "Conference",
            "date": datetime.date.today() + datetime.timedelta(days=15),
            "time": datetime.time(10, 0),
            "ticket_price": 499.00,
            "total_tickets": 500,
            "available_tickets": 500,
            "images": ["https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80"],
            "venue": venues[1]
        },
        {
            "title": "Garba Beats Navratri Night",
            "description": "Pre-Navratri night celebration featuring traditional folk singers and live orchestra. Garba dance, Gujarati food stalls, and prizes for best dancers.",
            "category": "Festival",
            "date": datetime.date.today() + datetime.timedelta(days=30),
            "time": datetime.time(19, 0),
            "ticket_price": 250.00,
            "total_tickets": 2000,
            "available_tickets": 2000,
            "images": ["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"],
            "venue": venues[0]
        },
        {
            "title": "Foodies & Music Carnival",
            "description": "A food truck festival featuring over 50 vendors from across Gujarat, combined with live indie music performances.",
            "category": "Music & Food",
            "date": datetime.date.today() + datetime.timedelta(days=45),
            "time": datetime.time(16, 0),
            "ticket_price": 100.00,
            "total_tickets": 3000,
            "available_tickets": 3000,
            "images": ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"],
            "venue": venues[2]
        }
    ]

    for e_data in events_data:
        event, created = Event.objects.get_or_create(
            title=e_data["title"],
            organizer=organizer,
            defaults={
                "description": e_data["description"],
                "category": e_data["category"],
                "date": e_data["date"],
                "time": e_data["time"],
                "ticket_price": e_data["ticket_price"],
                "total_tickets": e_data["total_tickets"],
                "available_tickets": e_data["available_tickets"],
                "images": e_data["images"],
                "venue": e_data["venue"]
            }
        )
        if created:
            print(f"Created event: {event.title}")
        else:
            print(f"Event {event.title} already exists.")

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
