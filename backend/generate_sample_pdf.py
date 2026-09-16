import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Event, EventBooking
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

User = get_user_model()

def generate_pdf(output_path):
    print("Generating ticket PDF...")
    
    # 1. Fetch seeded customer and event
    try:
        customer = User.objects.get(email="customer@example.com")
        event = Event.objects.first()
    except Exception as e:
        print("Error: Could not retrieve customer or event. Please run seed_db.py first.")
        sys.exit(1)
        
    # 2. Get or create a paid booking
    booking, created = EventBooking.objects.get_or_create(
        customer=customer,
        event=event,
        defaults={
            "tickets_count": 2,
            "total_price": event.ticket_price * 2,
            "status": "paid"
        }
    )
    if not created and booking.status != "paid":
        booking.status = "paid"
        booking.save()
        
    # 3. Create PDF output
    p = canvas.Canvas(output_path, pagesize=letter)
    
    # Draw ticket border
    p.setStrokeColorRGB(0.97, 0.27, 0.39) # #f84464 (BookMyShow pink accent)
    p.setLineWidth(3)
    p.rect(50, 350, 500, 420)
    
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

    # Divider
    p.setStrokeColorRGB(0.8, 0.8, 0.8)
    p.setLineWidth(1)
    p.line(80, 470, 520, 470)

    # Entry code footer
    p.setFillColorRGB(0.97, 0.27, 0.39)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(80, 440, "SECURE GATE ENTRY CODE:")
    p.setFillColorRGB(0.12, 0.16, 0.23)
    p.setFont("Courier", 10)
    p.drawString(80, 420, booking.qr_code_hash)
    
    p.setFont("Helvetica-Oblique", 9)
    p.setFillColorRGB(0.4, 0.4, 0.4)
    p.drawString(80, 380, "* Please show the QR Code on your mobile dashboard to scan at the gate.")
    p.drawString(80, 365, "* Ticket is non-transferable and non-refundable.")

    p.showPage()
    p.save()
    print(f"Sample PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_sample_pdf.py <output_pdf_path>")
        sys.exit(1)
    generate_pdf(sys.argv[1])
