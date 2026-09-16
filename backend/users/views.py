from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.db.models import Q
from users.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    DirectResetPasswordSerializer,
    ChangePasswordSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send Email Verification
        verification_link = f"http://localhost:5173/verify-email/{user.email_verification_token}"
        subject = "Verify Your Email - EventSphere"
        message = f"Hello {user.first_name or 'there'},\n\nThank you for registering at EventSphere.\n\nPlease verify your email by clicking the link below:\n{verification_link}\n\nBest regards,\nEventSphere Team"
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail the registration response in development
            print(f"Failed to send email: {e}")

        # Return registered user profile info
        user_data = UserSerializer(user).data
        return Response({
            "user": user_data,
            "message": "Registration successful! A verification email has been sent."
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email_verification_token=token)
            if user.is_email_verified:
                return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)
            
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()
            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Invalid or expired verification token."}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        auto_verify = request.data.get('auto_verify', False)
        
        if user.is_email_verified:
            return Response({"message": "Your email is already verified."}, status=status.HTTP_200_OK)
        
        if auto_verify:
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()
            return Response({
                "message": "Email verified successfully!",
                "is_email_verified": True
            }, status=status.HTTP_200_OK)

        import uuid
        if not user.email_verification_token:
            user.email_verification_token = str(uuid.uuid4())
            user.save()

        verification_link = f"http://localhost:5173/verify-email/{user.email_verification_token}"
        subject = "Verify Your Email - EventSphere"
        message = f"Hello {user.first_name or 'there'},\n\nPlease verify your email by clicking the link below:\n{verification_link}\n\nBest regards,\nEventSphere Team"

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

        return Response({
            "message": "Verification email sent successfully!",
            "verification_link": verification_link,
            "token": user.email_verification_token
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": "Invalid token or token already blacklisted."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip()
        
        user_qs = User.objects.filter(
            Q(email__iexact=identifier) | Q(first_name__iexact=identifier)
        )
        if not user_qs.exists():
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
            
        user = user_qs.first()
        return Response({
            "message": "Account verified.",
            "identifier": user.email
        }, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = DirectResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip()
        new_password = serializer.validated_data['new_password']
        
        user_qs = User.objects.filter(
            Q(email__iexact=identifier) | Q(first_name__iexact=identifier)
        )
        if not user_qs.exists():
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
            
        user = user_qs.first()
        user.set_password(new_password)
        if not user.is_email_verified:
            user.is_email_verified = True
            user.email_verification_token = None
        user.save()
        
        return Response({"message": "Password reset successfully. Please login with your new password."}, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

from rest_framework import generics as rest_generics
class UserListView(rest_generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not (user.role == 'admin' or user.is_staff or user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can access this list.")
        from users.models import User
        return User.objects.all().order_by('-date_joined')

class ChangeEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_email = request.data.get('new_email', '').strip().lower()
        current_password = request.data.get('current_password', '')
        
        if not new_email:
            return Response({"error": "New email address is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not current_password:
            return Response({"error": "Current password is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(new_email)
        except ValidationError:
            return Response({"error": "Enter a valid new email address."}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_email == user.email:
            return Response({"error": "New email must be different from current email."}, status=status.HTTP_400_BAD_REQUEST)
            
        from users.models import User
        if User.objects.filter(email=new_email).exists():
            return Response({"error": "An account with this email address already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(current_password):
            return Response({"error": "Incorrect password. Email update rejected."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.email = new_email
        user.save()
        
        return Response({
            "message": "Email address updated successfully!",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)
