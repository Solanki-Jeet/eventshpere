from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    RegisterView,
    CustomTokenObtainPairView,
    VerifyEmailView,
    ResendVerificationEmailView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    UserProfileView,
    UserListView,
    ChangeEmailView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='auth_resend_verification'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
    path('change-email/', ChangeEmailView.as_view(), name='auth_change_email'),
    path('list/', UserListView.as_view(), name='users_list'),
]
