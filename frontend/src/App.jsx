import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveRole } from './store/authSlice';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import FAQPage from './pages/FAQPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VenueFormPage from './pages/VenueFormPage';
import EventFormPage from './pages/EventFormPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import OrganizerAnalyticsPage from './pages/OrganizerAnalyticsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import StaffLoginPage from './pages/StaffLoginPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';

const HomeRedirect = () => {
  const { activeRole, user } = useSelector((state) => state.auth);
  const role = user?.role || activeRole || 'customer';
  const rolePath = role === 'plot_owner' ? '/plotowner' : `/${role}`;
  return <Navigate to={rolePath} replace />;
};

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { activeRole } = useSelector((state) => state.auth);

  React.useEffect(() => {
    const path = location.pathname;
    let targetRole = null;
    if (path.startsWith('/customer')) {
      targetRole = 'customer';
    } else if (path.startsWith('/plotowner')) {
      targetRole = 'plot_owner';
    } else if (path.startsWith('/organizer')) {
      targetRole = 'organizer';
    } else if (path.startsWith('/admin')) {
      targetRole = 'admin';
    }
    
    if (targetRole && targetRole !== activeRole) {
      dispatch(setActiveRole(targetRole));
    }
  }, [location.pathname, activeRole, dispatch]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <Navbar />

      {/* Main content body wrapper */}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/explore" element={<HomePage />} />
          <Route path="/faqs" element={<FAQPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-conditions" element={<TermsConditionsPage />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage roleOverride="customer" />} />
          <Route path="/login/plotowner" element={<LoginPage roleOverride="plot_owner" />} />
          <Route path="/login/organizer" element={<LoginPage roleOverride="organizer" />} />
          <Route path="/login/admin" element={<LoginPage roleOverride="admin" />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          {/* Protected Routes (Authenticated) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeRedirect />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Customer specific routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer', 'admin']} />}>
              <Route path="/customer" element={<HomePage />} />
            </Route>

            {/* Plot Owner specific routes */}
            <Route element={<ProtectedRoute allowedRoles={['plot_owner', 'admin']} />}>
              <Route path="/plotowner" element={<HomePage />} />
            </Route>

            {/* Venue & Event Form Routes — Accessible to all authenticated users */}
            <Route path="/venues/create" element={<VenueFormPage />} />
            <Route path="/venues/edit/:id" element={<VenueFormPage />} />
            <Route path="/events/create" element={<EventFormPage />} />
            <Route path="/events/edit/:id" element={<EventFormPage />} />

            {/* Organizer specific routes */}
            <Route element={<ProtectedRoute allowedRoles={['organizer', 'admin']} />}>
              <Route path="/organizer" element={<HomePage />} />
              <Route path="/organizer/analytics" element={<OrganizerAnalyticsPage />} />
            </Route>

            {/* Admin specific routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<HomePage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>

          {/* Redirect mismatched paths back to Landing or Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Footer (hidden on admin, organizer, and plotowner pages) */}
      {!['/admin', '/organizer', '/plotowner', '/venues', '/events'].some(path => location.pathname.startsWith(path)) && <Footer />}

      {/* Floating Back to Top */}
      <BackToTop />
    </div>
  );
}

export default App;
