import uuid
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'date_joined', 'avatar', 'mobile_number', 'address')
        read_only_fields = ('id', 'role', 'is_email_verified', 'date_joined')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Inject custom claims into the JWT token payload
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include user profile data directly in the response payload
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_email_verified': self.user.is_email_verified,
            'avatar': self.user.avatar,
            'mobile_number': self.user.mobile_number,
            'address': self.user.address
        }
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        # Email normalization and validation
        email = attrs.get('email', '').strip().lower()
        attrs['email'] = email
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(email)
        except ValidationError:
            raise serializers.ValidationError({"email": "Enter a valid email address."})

        # Password validations
        password = attrs['password']
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        
        import re
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter (A-Z)."})
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter (a-z)."})
        if not re.search(r'[0-9]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number (0-9)."})
        if not re.search(r'[^a-zA-Z0-9]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})

        if password != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Check if role is allowed
        role = attrs.get('role', User.CUSTOMER)
        if role not in [User.CUSTOMER, User.ORGANIZER, User.PLOT_OWNER]:
            raise serializers.ValidationError({"role": "Invalid role selected."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Create user with password passed directly to create_user
        user = User.objects.create_user(password=password, **validated_data)
        user.email_verification_token = str(uuid.uuid4())
        user.save()
        return user

import re

def validate_password_rules(password):
    if len(password) < 8:
        raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter (A-Z)."})
    if not re.search(r'[a-z]', password):
        raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter (a-z)."})
    if not re.search(r'[0-9]', password):
        raise serializers.ValidationError({"password": "Password must contain at least one number (0-9)."})
    if not re.search(r'[^a-zA-Z0-9]', password):
        raise serializers.ValidationError({"password": "Password must contain at least one special character."})

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        current_password = attrs.get('current_password', '')
        new_password = attrs.get('new_password', '')
        confirm_password = attrs.get('confirm_password', '')

        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "New password and confirm password must match."})

        if new_password == current_password:
            raise serializers.ValidationError({"new_password": "New password cannot be the same as current password."})

        validate_password_rules(new_password)
        return attrs

class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)

    def validate_identifier(self, value):
        val = value.strip().lower()
        if not val:
            raise serializers.ValidationError("Please enter your registered email or username.")
        return val

class DirectResetPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        new_password = attrs.get('new_password', '')
        confirm_password = attrs.get('confirm_password', '')

        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        validate_password_rules(new_password)
        return attrs
