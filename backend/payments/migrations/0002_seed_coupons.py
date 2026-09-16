from django.db import migrations
from django.utils import timezone
from datetime import timedelta

def seed_coupons(apps, schema_editor):
    Coupon = apps.get_model('payments', 'Coupon')
    # Create or update standard test coupon valid for a year
    Coupon.objects.get_or_create(
        code='AHMEDABAD20',
        defaults={
            'discount_percent': 20,
            'valid_from': timezone.now() - timedelta(days=5),
            'valid_to': timezone.now() + timedelta(days=365),
            'active': True
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_coupons),
    ]
