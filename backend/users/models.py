from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from users.managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    CUSTOMER = 'customer'
    ORGANIZER = 'organizer'
    PLOT_OWNER = 'plot_owner'
    ADMIN = 'admin'
    
    ROLE_CHOICES = [
        (CUSTOMER, 'Customer'),
        (ORGANIZER, 'Organizer'),
        (PLOT_OWNER, 'Plot Owner'),
        (ADMIN, 'Admin'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.TextField(blank=True, default='')
    mobile_number = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email.split('@')[0]

    def get_short_name(self):
        return self.first_name if self.first_name else self.email.split('@')[0]
