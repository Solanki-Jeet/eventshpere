import axios from 'axios';
import { store } from '../store';
import { setCredentials, logout } from '../store/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and request has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const state = store.getState();
      const refreshToken = state.auth.refresh;
      
      if (refreshToken) {
        try {
          // Attempt to fetch new access token using refresh token
          const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access, refresh } = response.data;
          const newRefreshToken = refresh || refreshToken;
          
          // Save new access and rotated refresh tokens
          store.dispatch(setCredentials({
            user: state.auth.user,
            access,
            refresh: newRefreshToken
          }));
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, force logout
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
