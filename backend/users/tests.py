from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.profile_url = reverse('auth_profile')
        
        self.user_data = {
            'email': 'customer@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'first_name': 'Sumit',
            'last_name': 'Gohel',
            'role': 'customer'
        }

    def test_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])
        self.assertEqual(response.data['user']['role'], 'customer')
        self.assertFalse(response.data['user']['is_email_verified'])
        
        # Check if database has user
        user = User.objects.get(email=self.user_data['email'])
        self.assertIsNotNone(user.email_verification_token)

    def test_registration_password_mismatch(self):
        data = self.user_data.copy()
        data['password_confirm'] = 'different123'
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_profile_access(self):
        # First register
        self.client.post(self.register_url, self.user_data)
        
        # Try login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])
        
        access_token = response.data['access']
        
        # Access profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], self.user_data['email'])

    def test_unauthenticated_profile_access(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_email_verification(self):
        # Register user
        reg_response = self.client.post(self.register_url, self.user_data)
        user = User.objects.get(email=self.user_data['email'])
        token = user.email_verification_token
        
        # Post verification
        verify_url = reverse('auth_verify_email')
        response = self.client.post(verify_url, {'token': token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify status changed
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)
        self.assertIsNone(user.email_verification_token)
