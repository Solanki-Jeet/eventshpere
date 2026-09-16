import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setVerified } from '../store/authSlice';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Ticket, ShieldCheck, Heart, 
  TrendingUp, Users, PlusCircle, AlertCircle, 
  IndianRupee, Landmark, HelpCircle, Activity, 
  Loader2, Trash2, Edit3, CheckCircle, XCircle, X, Search, Info, Download, QrCode, RefreshCw, Clock, Share2, Star, User, Bell, Settings, ShieldAlert, CheckCircle2, Save, Mail, Compass
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';
import CheckoutModal from '../components/CheckoutModal';
import VenueCalendar from '../components/VenueCalendar';
import NotificationsPage from './NotificationsPage';

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].substring(0, 2);
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;

  return `${strHours}:${minutes} ${ampm}`;
};

const formatEventDate = (e) => {
  if (!e) return '';
  const startDate = formatDateDDMMYYYY(e.date);
  const endDate = formatDateDDMMYYYY(e.end_date);
  if (endDate && endDate !== startDate) {
    return `${startDate} to ${endDate}`;
  }
  return startDate;
};

const HomePage = () => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const role = user?.role || 'customer';
  const navigate = useNavigate();
  const location = useLocation();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Customer State
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [liveExternalEvents, setLiveExternalEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myTicketBookings, setMyTicketBookings] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState([]);
  
  // Pagination & Sharing states
  const [currentPage, setCurrentPage] = useState(1);
  const [shareToast, setShareToast] = useState({ show: false, message: '' });
  
  // Gallery & Review states
  const [activeImage, setActiveImage] = useState(0);
  const [localReviews, setLocalReviews] = useState({});

  const dispatch = useDispatch();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const handleVerifyEmailNow = async () => {
    setIsVerifyingEmail(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await api.post('/api/auth/resend-verification/', { auto_verify: true });
      setProfileSuccess(res.data.message || 'Email verified successfully!');
      dispatch(setVerified());
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to verify email.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Dashboard Tab Navigation State
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboardTab = searchParams.get('tab') || 'explore';
  const setDashboardTab = (tab) => setSearchParams({ tab });

  // Profile Edit states
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Wishlist Tab states
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Notifications Tab states
  const [dashboardNotifications, setDashboardNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  // Settings Tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [notifPreference, setNotifPreference] = useState({ bookings: true, promotions: false, news: true });
  const [sandboxEnabled, setSandboxEnabled] = useState(true);

  // Sync profile state with Redux user
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setAvatar(user.avatar || '');
      setMobileNumber(user.mobile_number || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const loadWishlistItems = async () => {
    setIsWishlistLoading(true);
    try {
      const res = await api.get('/api/interactions/wishlist/');
      setWishlistItems(res.data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const loadNotifications = async () => {
    setIsNotificationsLoading(true);
    try {
      const res = await api.get('/api/interactions/notifications/');
      setDashboardNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardTab === 'wishlist') {
      loadWishlistItems();
    } else if (dashboardTab === 'notifications') {
      loadNotifications();
    }
  }, [dashboardTab]);

  // Handle URL auto-booking parameters (e.g. redirected from WishlistPage)
  useEffect(() => {
    const bookType = searchParams.get('bookType');
    const bookId = searchParams.get('bookId');
    if (bookType && bookId) {
      const numericId = parseInt(bookId, 10);
      if (bookType === 'venue') {
        api.get(`/api/venues/${numericId}/`).then(res => {
          if (res.data) openBookingModal(res.data);
        }).catch(console.error);
      } else if (bookType === 'event') {
        api.get(`/api/events/${numericId}/`).then(res => {
          if (res.data) {
            setBookingEvent(res.data);
            setTicketQty(1);
            setSelectedTicketType(null);
            fetchEventTicketTypes(res.data.id);
          }
        }).catch(console.error);
      }
    }
  }, [searchParams]);

  const handleMarkRead = async (notifOrId) => {
    const id = typeof notifOrId === 'object' ? notifOrId.id : notifOrId;
    const currentNotif = dashboardNotifications.find(n => n.id === id);
    const newStatus = currentNotif ? !currentNotif.is_read : true;
    try {
      await api.patch(`/api/interactions/notifications/${id}/`, { is_read: newStatus });
      setDashboardNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: newStatus } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/api/interactions/notifications/${id}/`);
      setDashboardNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.patch('/api/auth/profile/', {
        first_name: firstName,
        last_name: lastName,
        avatar: avatar,
        mobile_number: mobileNumber,
        address: address
      });
      // Sync store
      dispatch(updateUser(res.data));
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match.');
      return;
    }
    setIsSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');
    try {
      await api.post('/api/auth/profile/', {
        password: newPassword
      });
      setSettingsSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSettingsError('Failed to change password. Profile updates rejected.');
    } finally {
      setIsSavingSettings(false);
    }
  };



  const submitReview = (eventId, reviewText, rating) => {
    const newReview = {
      id: Date.now(),
      name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'You (Customer)',
      text: reviewText,
      rating,
      date: 'Just now'
    };
    setLocalReviews(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), newReview]
    }));
  };
  
  // Modals / Workflows state
  const [bookingVenue, setBookingVenue] = useState(null); // Selected venue for booking modal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [bookingEvent, setBookingEvent] = useState(null); // Selected event for ticket booking
  const [ticketQty, setTicketQty] = useState(1);
  
  // Receipt Modal State
  const [receiptModalData, setReceiptModalData] = useState(null);

  const handleViewPaymentReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/api/payments/${paymentId}/receipt/`);
      setReceiptModalData(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch payment receipt.');
    }
  };

  // Checkout Modal details
  const [checkoutDetails, setCheckoutDetails] = useState({
    isOpen: false,
    bookingType: 'event', // 'event' or 'venue'
    bookingId: null,
    amount: 0
  });

  // Organizer State
  const [myEvents, setMyEvents] = useState([]);
  const [organizerBookings, setOrganizerBookings] = useState([]);
  const [organizerSubView, setOrganizerSubView] = useState('dashboard'); // 'dashboard', 'book_venue', 'create_event'
  const [organizerVenueSearch, setOrganizerVenueSearch] = useState('');

  // Plot Owner State
  const [myPlots, setMyPlots] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookingRequests, setBookingRequests] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);

  // Common UI State
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Event Approval Workflow states
  const [adminTab, setAdminTab] = useState('overview');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedAdminEvent, setSelectedAdminEvent] = useState(null);
  const [rejectionInputId, setRejectionInputId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [venueRejectionInputId, setVenueRejectionInputId] = useState(null);
  const [venueRejectionReason, setVenueRejectionReason] = useState('');
  const [usersList, setUsersList] = useState([]);

  // Availability Calendar & Maintenance module states
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedVenueForCalendar, setSelectedVenueForCalendar] = useState(null);
  const [selectedCalendarSlot, setSelectedCalendarSlot] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // Multiple Ticket Types states
  const [eventTicketTypes, setEventTicketTypes] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [selectedEventForTickets, setSelectedEventForTickets] = useState(null);
  
  // Form inputs for managing ticket types
  const [ticketName, setTicketName] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPrice, setTicketPrice] = useState(0);
  const [ticketTotalQty, setTicketTotalQty] = useState(100);
  const [ticketMaxPerUser, setTicketMaxPerUser] = useState(10);
  const [ticketSaleStartDate, setTicketSaleStartDate] = useState('');
  const [ticketSaleStartTime, setTicketSaleStartTime] = useState('');
  const [ticketSaleEndDate, setTicketSaleEndDate] = useState('');
  const [ticketSaleEndTime, setTicketSaleEndTime] = useState('');
  const [ticketBenefits, setTicketBenefits] = useState('');
  const [ticketColor, setTicketColor] = useState('blue');
  const [ticketDisplayOrder, setTicketDisplayOrder] = useState(0);
  const [ticketStatus, setTicketStatus] = useState('active');
  const [editingTicketTypeId, setEditingTicketTypeId] = useState(null);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgCategoryFilter, setOrgCategoryFilter] = useState('');

  // Event Schedule States
  const [selectedEventForSchedule, setSelectedEventForSchedule] = useState(null);
  const [eventScheduleList, setEventScheduleList] = useState([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [newSessionStart, setNewSessionStart] = useState('');
  const [newSessionEnd, setNewSessionEnd] = useState('');
  const [newSessionSpeaker, setNewSessionSpeaker] = useState('');
  const [newSessionRoom, setNewSessionRoom] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [scheduleModalError, setScheduleModalError] = useState('');
  const [scheduleModalSuccess, setScheduleModalSuccess] = useState('');
  const [detailsTab, setDetailsTab] = useState('tickets'); // 'tickets' or 'agenda'

  // Advanced Filter state variables
  const [categoriesList, setCategoriesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedVenueType, setSelectedVenueType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedDateShortcut, setSelectedDateShortcut] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Reset pagination on filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery, selectedCity, selectedCategoryFilter, selectedVenueType, 
    selectedStatus, selectedAvailability, selectedDateShortcut, 
    priceMin, priceMax, startDateFilter, endDateFilter
  ]);

  useEffect(() => {
    if (location.state?.triggerBookVenue) {
      setOrganizerSubView('book_venue');
    }
  }, [location.state]);

  // Debouncing effect for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Load categories and cities metadata once on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const catRes = await api.get('/api/categories/');
        setCategoriesList(catRes.data);
        const cityRes = await api.get('/api/cities/');
        setCitiesList(cityRes.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    if (role === 'customer' || role === 'admin') {
      loadMetadata();
    }
  }, [role]);

  // Server-side filtering handler
  const loadFilteredEvents = async () => {
    setIsFilterLoading(true);
    try {
      const params = {};
      if (debouncedSearchKeyword) params.search = debouncedSearchKeyword;
      if (selectedCity) params.city = selectedCity;
      if (selectedCategoryFilter) params.category = selectedCategoryFilter;
      if (selectedVenueType) params.venue_type = selectedVenueType;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedAvailability) params.availability = selectedAvailability;
      if (selectedDateShortcut) params.date = selectedDateShortcut;
      if (startDateFilter) params.start_date = startDateFilter;
      if (endDateFilter) params.end_date = endDateFilter;
      if (priceMin) params.min_price = priceMin;
      if (priceMax) params.max_price = priceMax;
      if (selectedSort) params.sort = selectedSort;

      const res = await api.get('/api/events/', { params });
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to filter events:', err);
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Re-run filtering when any dependency changes
  useEffect(() => {
    if (role === 'customer' || role === 'admin') {
      loadFilteredEvents();
    }
  }, [debouncedSearchKeyword, selectedCity, selectedCategoryFilter, selectedVenueType, selectedStatus, selectedAvailability, selectedDateShortcut, startDateFilter, endDateFilter, priceMin, priceMax, selectedSort, role]);

  // Approve Event action
  const handleApproveEvent = async (eventId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/events/${eventId}/approve/`);
      // Update local state lists
      setEvents(events.map(e => e.id === eventId ? { ...e, status: 'approved', approved_by: user } : e));
      if (selectedAdminEvent?.id === eventId) {
        setSelectedAdminEvent({ ...selectedAdminEvent, status: 'approved', approved_by: user });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve event.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Event action
  const handleRejectEvent = async (eventId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/events/${eventId}/reject/`, { rejection_reason: rejectionReason });
      // Update local state lists
      setEvents(events.map(e => e.id === eventId ? { ...e, status: 'rejected', rejection_reason: rejectionReason } : e));
      if (selectedAdminEvent?.id === eventId) {
        setSelectedAdminEvent({ ...selectedAdminEvent, status: 'rejected', rejection_reason: rejectionReason });
      }
      setRejectionInputId(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject event.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Venue action (Admin-only)
  const handleApproveVenue = async (venueId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/venues/${venueId}/approve/`);
      setVenues(venues.map(v => v.id === venueId ? { ...v, approval_status: 'approved', is_approved: true } : v));
      setMyPlots(myPlots.map(v => v.id === venueId ? { ...v, approval_status: 'approved', is_approved: true } : v));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to approve venue.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Venue action (Admin-only)
  const handleRejectVenue = async (venueId) => {
    if (!venueRejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/venues/${venueId}/reject/`, { reason: venueRejectionReason });
      setVenues(venues.map(v => v.id === venueId ? { ...v, approval_status: 'rejected', is_approved: false, rejection_reason: venueRejectionReason } : v));
      setMyPlots(myPlots.map(v => v.id === venueId ? { ...v, approval_status: 'rejected', is_approved: false, rejection_reason: venueRejectionReason } : v));
      setVenueRejectionInputId(null);
      setVenueRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to reject venue.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resubmit Event action (for Organizer)
  const handleResubmitEvent = async (eventId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/events/${eventId}/resubmit/`);
      // Update local state lists
      setMyEvents(myEvents.map(e => e.id === eventId ? { ...e, status: 'pending', rejection_reason: null } : e));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resubmit event.');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch Schedule List
  const fetchEventSchedule = async (eventId) => {
    try {
      const res = await api.get(`/api/events/${eventId}/schedule/`);
      setEventScheduleList(res.data);
    } catch (err) {
      console.error('Failed to load event schedule:', err);
    }
  };

  // Add or Update Schedule Session
  const handleAddOrUpdateSession = async (e) => {
    e.preventDefault();
    setScheduleModalError('');
    setScheduleModalSuccess('');

    const payload = {
      title: newSessionTitle,
      description: newSessionDesc,
      start_time: newSessionStart,
      end_time: newSessionEnd,
      speaker_name: newSessionSpeaker || null,
      venue_room: newSessionRoom || null,
      display_order: 0,
      status: 'active'
    };

    try {
      if (editingSessionId) {
        await api.put(`/api/schedule/${editingSessionId}/`, payload);
        setScheduleModalSuccess('Session updated successfully!');
      } else {
        await api.post(`/api/events/${selectedEventForSchedule.id}/schedule/`, payload);
        setScheduleModalSuccess('Session created successfully!');
      }

      // Reset Form fields
      setNewSessionTitle('');
      setNewSessionDesc('');
      setNewSessionStart('');
      setNewSessionEnd('');
      setNewSessionSpeaker('');
      setNewSessionRoom('');
      setEditingSessionId(null);
      fetchEventSchedule(selectedEventForSchedule.id);
      fetchData(); // Sync with main listings
    } catch (err) {
      const errMsg = err.response?.data?.error || Object.values(err.response?.data || {}).join(' ') || 'Failed to save session.';
      setScheduleModalError(errMsg);
    }
  };

  // Delete Schedule Session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await api.delete(`/api/schedule/${sessionId}/`);
      setScheduleModalSuccess('Session deleted successfully!');
      fetchEventSchedule(selectedEventForSchedule.id);
      fetchData();
    } catch (err) {
      setScheduleModalError('Failed to delete session.');
    }
  };

  // Fetch Dashboards Data
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (role === 'customer') {
        const isAuth = !!user;
        if (isAuth) {
          const [venueRes, bookingRes, ticketRes, wishlistRes, liveRes] = await Promise.all([
            api.get('/api/venues/'),
            api.get('/api/venues/bookings/'),
            api.get('/api/events/bookings/'),
            api.get('/api/interactions/wishlist/'),
            api.get('/api/events/live/')
          ]);
          
          setVenues(Array.isArray(venueRes.data) ? venueRes.data : venueRes.data.results || []);
          setMyBookings(Array.isArray(bookingRes.data) ? bookingRes.data : bookingRes.data.results || []);
          setMyTicketBookings(Array.isArray(ticketRes.data) ? ticketRes.data : ticketRes.data.results || []);
          setLiveExternalEvents(Array.isArray(liveRes.data) ? liveRes.data : []);
          
          const wIds = wishlistRes.data.map(item => item.venue?.id || item.event?.id).filter(Boolean);
          setWishlistedIds(wIds);
        } else {
          // Guest mode: only public endpoints
          const [venueRes, liveRes] = await Promise.all([
            api.get('/api/venues/'),
            api.get('/api/events/live/')
          ]);
          setVenues(Array.isArray(venueRes.data) ? venueRes.data : venueRes.data.results || []);
          setLiveExternalEvents(Array.isArray(liveRes.data) ? liveRes.data : []);
          setMyBookings([]);
          setMyTicketBookings([]);
          setWishlistedIds([]);
        }
      } 
      else if (role === 'organizer') {
        const [eventRes, wishlistRes, orgBookingsRes, venueBookingRes, venueRes] = await Promise.all([
          api.get('/api/events/?my_events=true'),
          api.get('/api/interactions/wishlist/'),
          api.get('/api/events/bookings/'),
          api.get('/api/venues/bookings/'),
          api.get('/api/venues/')
        ]);
        setMyEvents(eventRes.data);
        setOrganizerBookings(orgBookingsRes.data);
        setMyBookings(Array.isArray(venueBookingRes.data) ? venueBookingRes.data : venueBookingRes.data.results || []);
        setVenues(Array.isArray(venueRes.data) ? venueRes.data : venueRes.data.results || []);
        
        const wIds = wishlistRes.data.map(item => item.venue?.id || item.event?.id).filter(Boolean);
        setWishlistedIds(wIds);
      } 
      else if (role === 'plot_owner') {
        const [plotRes, requestRes, paymentRes] = await Promise.all([
          api.get('/api/venues/?my_plots=true'),
          api.get('/api/venues/bookings/'),
          api.get('/api/payments/history/')
        ]);
        setMyPlots(plotRes.data);
        setBookingRequests(requestRes.data);
        setPaymentsHistory(Array.isArray(paymentRes.data) ? paymentRes.data : paymentRes.data?.results || []);
      }
      else if (role === 'admin') {
        // Fetch venues
        try {
          const res = await api.get('/api/venues/');
          setVenues(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
          console.error("Failed to load venues:", err);
          setError("Failed to load venues listings.");
        }

        // Fetch bookings
        try {
          const res = await api.get('/api/venues/bookings/');
          setBookingRequests(res.data);
        } catch (err) {
          console.error("Failed to load venue bookings:", err);
          setError("Failed to load venue bookings.");
        }

        // Fetch events
        try {
          const res = await api.get('/api/events/');
          setEvents(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
          console.error("Failed to load events:", err);
          setError("Failed to load events.");
        }

        // Fetch payments
        try {
          const res = await api.get('/api/payments/history/');
          setPaymentsHistory(Array.isArray(res.data) ? res.data : res.data?.results || []);
        } catch (err) {
          console.error("Failed to load payments history:", err);
          setError("Failed to load payments history.");
        }

        // Fetch users (using correct path '/api/auth/list/')
        try {
          const res = await api.get('/api/auth/list/');
          setUsersList(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
          console.error("Failed to load users list:", err);
          setError("Failed to load users list.");
        }
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      setError(`Failed to refresh dashboard data: ${err.response?.data?.error || err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  // Wishlist Action Toggle
  const handleWishlistToggle = async (type, id) => {
    try {
      await api.post('/api/interactions/wishlist/toggle/', { [type]: id });
      if (wishlistedIds.includes(id)) {
        setWishlistedIds(wishlistedIds.filter(wId => wId !== id));
      } else {
        setWishlistedIds([...wishlistedIds, id]);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist.');
    }
  };

  // CRUD Delete actions
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/api/events/${eventId}/`);
      setMyEvents(myEvents.filter(e => e.id !== eventId));
    } catch (err) {
      setError('Failed to delete event.');
    }
  };

  const handleDeletePlot = async (plotId) => {
    if (!window.confirm("Are you sure you want to delete this party plot?")) return;
    try {
      await api.delete(`/api/venues/${plotId}/`);
      setMyPlots(myPlots.filter(p => p.id !== plotId));
    } catch (err) {
      setError('Failed to delete party plot.');
    }
  };

  // Booking Requests Actions (Owner accepts/rejects)
  const handleBookingRequest = async (id, statusUpdate) => {
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/api/venues/bookings/${id}/`, { status: statusUpdate });
      setBookingRequests(
        bookingRequests.map(req => req.id === id ? { ...req, status: statusUpdate } : req)
      );
    } catch (err) {
      // Show the exact backend error (e.g. date conflict message) in a visible alert
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to process booking request.';
      setError(msg);
      // Scroll to top so the error banner is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setActionLoading(false);
    }
  };


  // Fetch Calendar availability events for a venue
  const fetchCalendarEvents = async (venueId) => {
    try {
      const res = await api.get(`/api/venues/${venueId}/calendar/`);
      setCalendarEvents(res.data);
    } catch (err) {
      console.error('Failed to load venue calendar:', err);
    }
  };

  // Add a Maintenance Day
  const handleAddMaintenanceDay = async (venueId) => {
    if (!startDate || !endDate || !maintenanceReason) {
      setModalError('Please specify start date, end date and reason.');
      return;
    }
    const todayString = new Date().toISOString().split('T')[0];
    if (startDate < todayString) {
      setModalError('Maintenance start date cannot be in the past.');
      return;
    }
    if (endDate < startDate) {
      setModalError('Maintenance end date cannot be before the start date.');
      return;
    }
    setActionLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      await api.post('/api/venues/maintenance/', {
        venue: venueId,
        start_date: startDate,
        end_date: endDate,
        reason: maintenanceReason
      });
      setModalSuccess('Maintenance registered successfully!');
      setMaintenanceReason('');
      setStartDate('');
      setEndDate('');
      // Reload calendar events
      fetchCalendarEvents(venueId);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || 'Failed to schedule maintenance.';
      setModalError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a Maintenance Day
  const handleDeleteMaintenanceDay = async (maintenanceId, venueId) => {
    if (!window.confirm("Are you sure you want to remove this maintenance entry?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/venues/maintenance/${maintenanceId}/`);
      setSelectedEventDetails(null);
      fetchCalendarEvents(venueId);
    } catch (err) {
      alert('Failed to delete maintenance.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve a Booking Request (Venue Owner / Admin)
  const handleApproveBookingRequest = async (bookingId, venueId = null) => {
    setActionLoading(true);
    try {
      await api.post(`/api/venues/bookings/${bookingId}/approve/`);
      alert('Booking request approved!');
      setSelectedEventDetails(null);
      // Reload
      if (venueId) fetchCalendarEvents(venueId);
      // Refresh general dashboard stats
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject a Booking Request (Venue Owner / Admin)
  const handleRejectBookingRequest = async (bookingId, venueId = null) => {
    setActionLoading(true);
    try {
      await api.post(`/api/venues/bookings/${bookingId}/reject/`);
      alert('Booking request rejected.');
      setSelectedEventDetails(null);
      // Reload
      if (venueId) fetchCalendarEvents(venueId);
      // Refresh general dashboard stats
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCalendarDateSelect = (start, end) => {
    if (start === end) {
      if (startDate && start >= startDate) {
        setEndDate(start);
      } else {
        setStartDate(start);
        setEndDate(end);
      }
    } else {
      setStartDate(start);
      setEndDate(end);
    }
  };

  const getEstimatedPrice = () => {
    if (!bookingVenue || !startDate || !endDate) return 0;
    if (startDate.length !== 10 || endDate.length !== 10) return 0;
    const startYear = parseInt(startDate.split('-')[0], 10);
    const endYear = parseInt(endDate.split('-')[0], 10);
    if (isNaN(startYear) || isNaN(endYear) || startYear < 2000 || endYear < 2000) return 0;

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 0;

    const days = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days * parseFloat(bookingVenue.price_per_day || 0) : 0;
  };

  // Open booking request modal for venues
  const openBookingModal = (venue) => {
    if (!isAuthenticated && !token) {
      alert("You need to register an account or log in first!");
      navigate('/login');
      return;
    }
    setBookingVenue(venue);
    setStartDate('');
    setEndDate('');
    setModalError('');
    setModalSuccess('');
    fetchCalendarEvents(venue.id);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setModalError('Please select both start and end dates.');
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];
    if (startDate < todayString) {
      setModalError('Booking start date cannot be in the past.');
      return;
    }
    if (endDate < startDate) {
      setModalError('Booking end date cannot be before the start date.');
      return;
    }

    setModalError('');
    setModalSuccess('');
    setActionLoading(true);

    try {
      await api.post('/api/venues/bookings/', {
        venue: bookingVenue.id,
        start_date: startDate,
        end_date: endDate
      });
      setModalSuccess('Booking request sent successfully! Waiting for plot owner approval.');
      setTimeout(() => {
        setBookingVenue(null);
        fetchData(); // Refresh history list
      }, 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        setModalError('You must be logged in to request a booking. Please log in and try again.');
      } else {
        setModalError(
          err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.start_date?.[0] ||
          'Failed to request booking. Please check date conflicts.'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const fetchEventTicketTypes = async (eventId) => {
    try {
      const res = await api.get(`/api/events/${eventId}/tickets/`);
      setEventTicketTypes(res.data);
    } catch (err) {
      console.error('Failed to fetch event ticket types:', err);
    }
  };

  const handleSaveTicketType = async (e) => {
    e.preventDefault();
    if (!ticketName || ticketPrice < 0 || ticketTotalQty <= 0) {
      setModalError('Please supply valid ticket name, price, and quantity.');
      return;
    }
    setActionLoading(true);
    setModalError('');
    setModalSuccess('');
    
    let saleStartFinal = new Date().toISOString();
    if (ticketSaleStartDate && ticketSaleStartTime) {
      saleStartFinal = new Date(`${ticketSaleStartDate}T${ticketSaleStartTime}`).toISOString();
    }
    let saleEndFinal = new Date(Date.now() + 86400000 * 7).toISOString();
    if (ticketSaleEndDate && ticketSaleEndTime) {
      saleEndFinal = new Date(`${ticketSaleEndDate}T${ticketSaleEndTime}`).toISOString();
    }

    const payload = {
      name: ticketName,
      description: ticketDesc,
      price: parseFloat(ticketPrice),
      total_quantity: parseInt(ticketTotalQty),
      max_per_user: parseInt(ticketMaxPerUser),
      sale_start: saleStartFinal,
      sale_end: saleEndFinal,
      benefits: ticketBenefits.split(',').map(b => b.trim()).filter(Boolean),
      color: ticketColor,
      display_order: parseInt(ticketDisplayOrder),
      status: ticketStatus
    };

    try {
      if (editingTicketTypeId) {
        await api.put(`/api/events/tickets/${editingTicketTypeId}/`, payload);
        setModalSuccess('Ticket category updated successfully!');
      } else {
        await api.post(`/api/events/${selectedEventForTickets.id}/tickets/`, payload);
        setModalSuccess('New ticket category created successfully!');
      }
      
      // Reset form fields
      setTicketName('');
      setTicketDesc('');
      setTicketPrice(0);
      setTicketTotalQty(100);
      setTicketMaxPerUser(10);
      setTicketSaleStartDate('');
      setTicketSaleStartTime('');
      setTicketSaleEndDate('');
      setTicketSaleEndTime('');
      setTicketBenefits('');
      setTicketColor('blue');
      setTicketDisplayOrder(0);
      setTicketStatus('active');
      setEditingTicketTypeId(null);
      
      // Reload list
      fetchEventTicketTypes(selectedEventForTickets.id);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object' && !errData.error && !errData.detail) {
        const firstKey = Object.keys(errData)[0];
        let errMsg = errData[firstKey];
        if (Array.isArray(errMsg)) errMsg = errMsg[0];
        setModalError(`${firstKey.replace('_', ' ')}: ${errMsg}`);
      } else {
        setModalError(errData?.error || errData?.detail || 'Failed to save ticket category.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicketType = async (ticketId, eventId) => {
    if (!window.confirm("Are you sure you want to delete this ticket category?")) return;
    try {
      await api.delete(`/api/events/tickets/${ticketId}/`);
      fetchEventTicketTypes(eventId);
    } catch (err) {
      alert('Failed to delete ticket category.');
    }
  };

  const handleDuplicateTicketType = async (ticketObj, eventId) => {
    setActionLoading(true);
    try {
      const payload = {
        name: `${ticketObj.name} (Copy)`,
        description: ticketObj.description,
        price: parseFloat(ticketObj.price),
        total_quantity: parseInt(ticketObj.total_quantity),
        max_per_user: parseInt(ticketObj.max_per_user),
        sale_start: ticketObj.sale_start,
        sale_end: ticketObj.sale_end,
        benefits: ticketObj.benefits,
        color: ticketObj.color,
        display_order: parseInt(ticketObj.display_order) + 1,
        status: ticketObj.status
      };
      await api.post(`/api/events/${eventId}/tickets/`, payload);
      fetchEventTicketTypes(eventId);
    } catch (err) {
      alert('Failed to duplicate ticket category.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedStandardPasses = async (event) => {
    if (!event) return;
    setActionLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      const basePrice = parseFloat(event.ticket_price || 299);
      const totalQty = parseInt(event.total_tickets || 500);

      const passes = [
        {
          name: "General Pass",
          description: "Standard festival entry pass for Garba ground and food court access.",
          price: basePrice,
          total_quantity: Math.max(10, Math.floor(totalQty * 0.6)),
          remaining_quantity: Math.max(10, Math.floor(totalQty * 0.6)),
          max_per_user: 10,
          benefits: ["Main Garba Lawn Access", "General Parking Area", "Food Court Access"],
          color: "green",
          display_order: 1,
          status: "active"
        },
        {
          name: "VIP Pass",
          description: "Fast-track VIP entry with prime orchestra viewing zone and VIP parking.",
          price: Math.round(basePrice * 2.5),
          total_quantity: Math.max(5, Math.floor(totalQty * 0.3)),
          remaining_quantity: Math.max(5, Math.floor(totalQty * 0.3)),
          max_per_user: 5,
          benefits: ["Fast-Track VIP Entry Gate", "Prime Orchestra Zone Access", "Dedicated VIP Parking Pass"],
          color: "amber",
          display_order: 2,
          status: "active"
        },
        {
          name: "Deluxe Pass",
          description: "Premium luxury pass including stage-side lounge, complimentary food & drinks, and photo-op zone.",
          price: Math.round(basePrice * 4.5),
          total_quantity: Math.max(2, Math.floor(totalQty * 0.1)),
          remaining_quantity: Math.max(2, Math.floor(totalQty * 0.1)),
          max_per_user: 5,
          benefits: ["Stage-Side Reserved Lounge", "Complimentary Food Voucher", "Celebrity & Artiste Photo-Op", "Valet Parking Included"],
          color: "purple",
          display_order: 3,
          status: "active"
        }
      ];

      for (const p of passes) {
        await api.post(`/api/events/${event.id}/tickets/`, p);
      }
      setModalSuccess('Successfully added General, VIP, and Deluxe pass categories!');
      fetchEventTicketTypes(event.id);
    } catch (err) {
      setModalError('Failed to seed pass categories.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open ticket booking modal for local events
  const openTicketModal = async (event) => {
    if (!isAuthenticated && !token) {
      alert("You need to register an account or log in first!");
      navigate('/login');
      return;
    }
    setBookingEvent(event);
    setDetailsTab('tickets');
    setActiveImage(0);
    setTicketQty(1);
    setModalError('');
    setModalSuccess('');
    setEventTicketTypes([]);
    setSelectedTicketType(null);
    
    if (!event.is_live_external) {
      try {
        const res = await api.get(`/api/events/${event.id}/tickets/`);
        setEventTicketTypes(res.data);
        const activeTickets = res.data.filter(t => t.status === 'active');
        if (activeTickets.length > 0) {
          setSelectedTicketType(activeTickets[0]);
        }
      } catch (err) {
        console.error('Failed to load event tickets:', err);
      }
    }
  };

  const handleCreateTicketBooking = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setActionLoading(true);

    try {
      let response;
      if (bookingEvent.is_live_external) {
        response = await api.post('/api/events/bookings/book_external/', {
          title: bookingEvent.title,
          description: bookingEvent.description,
          category: bookingEvent.category,
          date: bookingEvent.date,
          time: bookingEvent.time,
          ticket_price: bookingEvent.ticket_price,
          image: bookingEvent.images?.[0] || '',
          tickets_count: ticketQty
        });
      } else {
        if (!selectedTicketType) {
          throw new Error('Please select a ticket category.');
        }
        response = await api.post('/api/events/bookings/', {
          event: bookingEvent.id,
          ticket_type: selectedTicketType.id,
          tickets_count: ticketQty
        });
      }
      
      const booking = response.data;
      
      // Close ticket quantity picker modal
      setBookingEvent(null);
      
      // 2. Open payment checkout modal
      setCheckoutDetails({
        isOpen: true,
        bookingType: 'event',
        bookingId: booking.id,
        amount: parseFloat(booking.total_price)
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setModalError('You must be logged in to book tickets. Please log in and try again.');
      } else {
        setModalError(
          err.response?.data?.tickets_count?.[0] ||
          err.response?.data?.error ||
          'Failed to reserve tickets. Please check availability.'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Open checkout for approved venue bookings
  const handlePayVenueRental = (booking) => {
    setCheckoutDetails({
      isOpen: true,
      bookingType: 'venue',
      bookingId: booking.id,
      amount: parseFloat(booking.total_price)
    });
  };

  // PDF Download Trigger — use api baseURL to avoid hardcoded localhost
  const handleDownloadPDF = async (bookingId) => {
    try {
      const response = await api.get(`/api/events/bookings/${bookingId}/pdf/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download ticket PDF.');
    }
  };

  const handleDownloadVenueInvoicePDF = async (bookingId) => {
    try {
      const response = await api.get(`/api/venues/bookings/${bookingId}/pdf/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_venue_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download venue invoice.');
    }
  };

  const handleCancelEventBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel these tickets and request a refund?")) return;
    setActionLoading(true);
    try {
      await api.post(`/api/events/bookings/${bookingId}/cancel/`);
      alert("Tickets cancelled successfully! Refund has been initiated.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel tickets.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelVenueBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this venue booking and request a refund?")) return;
    setActionLoading(true);
    try {
      await api.post(`/api/venues/bookings/${bookingId}/cancel/`);
      alert("Venue booking cancelled successfully! Refund has been initiated.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setActionLoading(false);
    }
  };



  const filteredVenuesForOrganizer = (venues || []).filter(v => {
    if (!organizerVenueSearch.trim()) return true;
    const q = organizerVenueSearch.toLowerCase().trim();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q)) ||
      (v.capacity && v.capacity.toString().includes(q))
    );
  });

  const renderOrganizerVenueBooker = () => {
    return (
      <div className="space-y-6 text-left">
        {/* Search Bar for Party Plots */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center bg-[#181825] border border-white/10 rounded-full px-5 py-3.5 shadow-xl hover:border-[#7C3AED]/60 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/40 transition-all cursor-text">
            <Search className="text-[#7C3AED] shrink-0 mr-3 pointer-events-none" size={20} />
            <input
              type="text"
              value={organizerVenueSearch}
              onChange={(e) => setOrganizerVenueSearch(e.target.value)}
              placeholder="Search party plot by name, location, or capacity..."
              className="w-full bg-transparent text-white text-base md:text-lg placeholder-slate-400 font-medium outline-none border-none focus:outline-none focus:ring-0 text-left h-10"
              style={{
                caretColor: '#a855f7',
                cursor: 'text',
                lineHeight: '2.2rem',
                border: 'none',
                outline: 'none',
                boxShadow: 'none'
              }}
            />
            {organizerVenueSearch && (
              <button
                type="button"
                onClick={() => setOrganizerVenueSearch('')}
                className="text-[#9CA3AF] hover:text-white font-bold text-xs shrink-0 cursor-pointer ml-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div>
          {filteredVenuesForOrganizer.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenuesForOrganizer.map(v => (
                <div key={v.id} className="bg-[#181825] border border-white/10 rounded-[20px] overflow-hidden flex flex-col h-full shadow-xl relative text-left group hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#7C3AED]/40 transition-all duration-300">
                  <div className="h-44 relative bg-[#141420] overflow-hidden">
                    <img src={v.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500'} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1.5 line-clamp-1">{v.name}</h4>
                      <p className="text-[#9CA3AF] text-xs line-clamp-2 leading-relaxed mb-4">{v.description}</p>
                      
                      <div className="flex items-center gap-2.5 text-xs text-[#9CA3AF] mb-4 font-medium">
                        <Users size={14} className="text-[#7C3AED]" />
                        <span>Capacity: {v.capacity} guests</span>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-white/10 pt-4 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Per Day</span>
                        <span className="font-black text-white text-base">₹{parseFloat(v.price_per_day || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <button
                        onClick={() => openBookingModal(v)}
                        className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#7C3AED]/20 active:scale-95"
                      >
                        Book Venue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#181825] border border-white/10 rounded-[22px] text-[#9CA3AF] text-sm">
              No party plots match your query.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 1. CUSTOMER PORTAL RENDER
  const renderCustomerDashboard = () => {
    const categories = ['All', 'Concert', 'Festival', 'Conference', 'Social / Garba', 'Exhibition', 'Wedding'];

    const renderCountdown = (dateStr) => {
      if (!dateStr) return null;
      const evtDate = new Date(dateStr);
      const today = new Date();
      
      const evtTime = new Date(evtDate.getFullYear(), evtDate.getMonth(), evtDate.getDate()).getTime();
      const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      
      const diffMs = evtTime - todayTime;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-slate-900/75 text-slate-300 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider">
            Completed
          </span>
        );
      } else if (diffDays === 0) {
        return (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider animate-pulse">
            Happening Today
          </span>
        );
      } else if (diffDays === 1) {
        return (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-amber-500/90 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider">
            Starts Tomorrow
          </span>
        );
      } else {
        return (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-slate-900/60 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider">
            Starts in {diffDays} days
          </span>
        );
      }
    };

    const handleShareEvent = (event) => {
      const shareUrl = `${window.location.origin}/events/${event.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareToast({ show: true, message: `Copied link for "${event.title}" to clipboard!` });
        setTimeout(() => {
          setShareToast({ show: false, message: '' });
        }, 3000);
      }).catch(() => {
        alert('Failed to copy link.');
      });
    };

    const renderDetailsInfoTab = () => {
      const eventId = bookingEvent.id;
      
      // Mock images fallback list for gallery
      const defaultImages = [
        bookingEvent.images?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500'
      ];
      
      // Get similar events of same category
      const similarEvents = events
        .filter(e => e.category === bookingEvent.category && e.id !== bookingEvent.id)
        .slice(0, 2);

      // Reviews map
      const initialReviews = [
        { id: 1, name: 'Anjali Sharma', rating: 5, text: 'Amazing event planning! The sound quality and seating arrangements were top-notch.', date: '2 days ago' },
        { id: 2, name: 'Karan Patel', rating: 4, text: 'Great coordination and vibe. The parking was a bit tight, but everything else was superb.', date: '1 week ago' }
      ];
      
      const currentEventReviews = [...initialReviews, ...(localReviews[eventId] || [])];

      // Countdown calculations
      const calculateDetailedCountdown = () => {
        if (!bookingEvent.date) return { days: 0, hours: 0, mins: 0 };
        const target = new Date(`${bookingEvent.date}T${bookingEvent.time || '18:00:00'}`);
        const now = new Date();
        const diffMs = target.getTime() - now.getTime();
        
        if (diffMs <= 0) return null;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { days, hours, mins };
      };

      const countdown = calculateDetailedCountdown();

      return (
        <div className="space-y-6 text-left max-h-[60vh] overflow-y-auto pr-2 py-2">
          {/* Gallery View */}
          <div className="space-y-3">
            <div className="h-64 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img src={defaultImages[activeImage]} alt="Gallery preview" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex gap-3">
              {defaultImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === idx ? 'border-primary-500 scale-102' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Countdown & Event Title Header */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <span className="text-[9px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {bookingEvent.category}
              </span>
              <h4 className="font-extrabold text-slate-800 text-base mt-1.5">{bookingEvent.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Date: {formatEventDate(bookingEvent)} ({formatTimeAMPM(bookingEvent.time || '18:00')})</p>
            </div>

            {/* Countdown grids */}
            {countdown ? (
              <div className="flex gap-2">
                {[
                  { value: countdown.days, unit: 'Days' },
                  { value: countdown.hours, unit: 'Hrs' },
                  { value: countdown.mins, unit: 'Mins' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-center min-w-14 shadow-sm">
                    <span className="block font-black text-slate-800 text-sm">{String(item.value).padStart(2, '0')}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{item.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-505 text-xs font-bold uppercase tracking-wider border border-slate-200">
                Completed
              </div>
            )}
          </div>

          {/* Organizer Card */}
          <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-sm">
                {bookingEvent.organizer?.email?.charAt(0).toUpperCase() || 'O'}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Organized By</span>
                <span className="font-bold text-slate-800 text-xs truncate max-w-56 block">{bookingEvent.organizer?.email || 'EventSphere Events'}</span>
              </div>
            </div>
            
            <a
              href={`mailto:${bookingEvent.organizer?.email || 'support@eventsphere.com'}?subject=Inquiry regarding ${bookingEvent.title}`}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Customer Reviews Section */}
          <div className="space-y-4">
            <h5 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">
              Customer Reviews ({currentEventReviews.length})
            </h5>
            
            <div className="space-y-3">
              {currentEventReviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-55/60 border border-slate-200/60 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{rev.name}</span>
                    <span className="text-[10px] text-slate-450 font-semibold">{rev.date}</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className={i < rev.rating ? "fill-amber-400" : "text-slate-200"} />
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{rev.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Review Form */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-inner/5 space-y-3 text-left mt-2">
              <span className="font-bold text-slate-705 text-[10px] uppercase tracking-wider block">Write a Review</span>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const reviewInput = e.target.elements.reviewText;
                  const ratingInput = e.target.elements.reviewRating;
                  if (reviewInput.value) {
                    submitReview(eventId, reviewInput.value, parseInt(ratingInput.value));
                    reviewInput.value = '';
                    ratingInput.value = '5';
                  }
                }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Rating:</label>
                  <select
                    name="reviewRating"
                    defaultValue="5"
                    className="px-2.5 py-1 text-xs border border-slate-202 rounded-lg bg-white outline-none cursor-pointer text-slate-705"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
                <div className="relative">
                  <textarea
                    name="reviewText"
                    placeholder="Describe your event experience..."
                    rows="2"
                    required
                    className="w-full p-3 rounded-2xl bg-white border border-slate-202 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-900 text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </form>
            </div>
          </div>

          {/* Similar Events */}
          {similarEvents.length > 0 && (
            <div className="space-y-3 pt-2">
              <h5 className="font-extrabold text-slate-850 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">
                Similar Events
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarEvents.map(sim => (
                  <div 
                    key={sim.id} 
                    onClick={() => openTicketModal(sim)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex gap-3 cursor-pointer hover:border-slate-350 hover:shadow-sm transition-all text-left"
                  >
                    <div className="h-14 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={sim.images?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500'} alt={sim.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex flex-col justify-between">
                      <div>
                        <h6 className="font-bold text-slate-800 text-xs truncate">{sim.title}</h6>
                        <span className="text-[9px] text-slate-400 font-semibold">{sim.date}</span>
                      </div>
                      <span className="text-[10px] font-black text-primary-500">
                        {['Concert', 'Social / Garba'].includes(sim.category) ? 'Category-Based Passes' : `₹${sim.ticket_price}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Action row */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBookingEvent(null)}
              className="py-2.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-205 text-slate-655 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      );
    };

    const renderEventCard = (e) => {
      const formattedPrice = ['Concert', 'Social / Garba'].includes(e.category) 
        ? null 
        : parseFloat(e.ticket_price) === 0 
          ? 'FREE' 
          : `₹${Math.round(parseFloat(e.ticket_price || 0)).toLocaleString('en-IN')}`;

      return (
        <div key={e.id} className="bg-[#181825] border border-white/10 rounded-[20px] overflow-hidden flex flex-col h-full shadow-xl relative text-left group hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#7C3AED]/40 transition-all duration-300">
          {/* Image Section */}
          <div className="h-[200px] relative bg-[#141420] overflow-hidden rounded-t-[20px]">
            <img src={e.images?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500'} alt={e.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181825] via-transparent to-transparent opacity-80" />

            <span className="absolute top-3 left-3 bg-[#7C3AED]/30 border border-[#7C3AED]/40 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-xl backdrop-blur-md z-10 uppercase tracking-wider">
              {e.category}
            </span>
            
            {/* Event Countdown Pill */}
            {renderCountdown(e.date)}

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleWishlistToggle('event', e.id);
                }}
                className="h-9 w-9 rounded-full bg-[#0B0B12]/70 backdrop-blur-md border border-white/10 text-[#B5B8C5] hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors shadow-md"
              >
                <Heart size={15} className={wishlistedIds.includes(e.id) ? "fill-rose-500 text-rose-500" : ""} />
              </button>
            </div>
          </div>
          
          {/* Content Layout */}
          <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
            <div className="space-y-2">
              <h4 className="text-[19px] font-bold text-white leading-snug line-clamp-1">{e.title}</h4>
              <p className="text-[13px] font-normal text-[#9CA3AF] line-clamp-2 leading-relaxed h-[38px]">{e.description}</p>
              
              <div className="space-y-1.5 pt-1 text-[13px] font-medium text-[#9CA3AF]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#7C3AED] shrink-0" />
                  <span className="truncate">{formatEventDate(e)} ({formatTimeAMPM(e.time)})</span>
                </div>
                {(e.venue_details || e.location) && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#7C3AED] mt-0.5 shrink-0" />
                    <span className="line-clamp-1 text-[#9CA3AF]">
                      {e.venue_details ? `${e.venue_details.name}, ${e.venue_details.address}` : e.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {e.tags && e.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {e.tags.map((tag, idx) => (
                  <span key={idx} className="text-[11px] font-medium text-purple-300 bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Section */}
            <div className="pt-3.5 border-t border-white/10 flex justify-between items-center gap-2 mt-auto">
              <div className="flex flex-col min-w-0 flex-1 justify-center text-left">
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">PRICE</span>
                <div className="truncate">
                  {formattedPrice ? (
                    <span className="text-[18px] font-extrabold text-white leading-tight">{formattedPrice}</span>
                  ) : (
                    <span className="text-[13px] font-bold text-[#7C3AED] block truncate">Category Passes</span>
                  )}
                </div>
              </div>
              
              {e.available_tickets > 0 ? (
                <button
                  onClick={() => openTicketModal(e)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-bold py-2.5 px-4 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center active:scale-95"
                >
                  Book Tickets
                </button>
              ) : (
                <span className="text-[12px] text-rose-400 font-bold border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                  Sold Out
                </span>
              )}
            </div>
          </div>
        </div>
      );
    };

    const renderFilterSidebar = () => {
      return (
        <div className="bg-[#141420] border border-white/10 p-6 rounded-[22px] shadow-xl text-left space-y-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="font-bold text-white text-[18px] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#7C3AED]" />
              Filter Listings
            </h4>
            {(selectedCity || selectedCategoryFilter || selectedVenueType || selectedStatus || selectedAvailability || selectedDateShortcut || priceMin || priceMax || startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCity('');
                  setSelectedCategoryFilter('');
                  setSelectedVenueType('');
                  setSelectedStatus('');
                  setSelectedAvailability('');
                  setSelectedDateShortcut('');
                  setStartDateFilter('');
                  setEndDateFilter('');
                  setPriceMin('');
                  setPriceMax('');
                }}
                className="text-[13px] text-[#7C3AED] hover:text-[#6D28D9] font-semibold transition-all cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B12] border border-white/10 outline-none text-[15px] text-white cursor-pointer focus:border-[#7C3AED] transition-colors"
            >
              <option value="">All Cities</option>
              {citiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">Category</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B12] border border-white/10 outline-none text-[15px] text-white cursor-pointer focus:border-[#7C3AED] transition-colors"
            >
              <option value="">All Categories</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Venue Type */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">Event Venue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['indoor', 'outdoor'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedVenueType(selectedVenueType === type ? '' : type)}
                  className={`py-2 rounded-xl border text-[14px] font-semibold capitalize transition-all cursor-pointer ${
                    selectedVenueType === type 
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]' 
                      : 'bg-[#0B0B12] border-white/10 text-[#B5B8C5] hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">Event Date</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { label: 'Today', value: 'today' },
                { label: 'Tomorrow', value: 'tomorrow' },
                { label: 'This Week', value: 'this_week' },
                { label: 'This Month', value: 'this_month' }
              ].map(shortcut => (
                <button
                  key={shortcut.value}
                  type="button"
                  onClick={() => {
                    setSelectedDateShortcut(selectedDateShortcut === shortcut.value ? '' : shortcut.value);
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-[13px] font-medium capitalize transition-all truncate cursor-pointer ${
                    selectedDateShortcut === shortcut.value 
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]' 
                      : 'bg-[#0B0B12] border-white/10 text-[#B5B8C5] hover:bg-white/5'
                  }`}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-2 space-y-2">
              <span className="text-[12px] font-medium text-[#9CA3AF]">Custom Date Range:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setSelectedDateShortcut('');
                  }}
                  className="w-full p-2 bg-[#0B0B12] border border-white/10 rounded-xl text-[13px] text-white outline-none focus:border-[#7C3AED]"
                />
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setSelectedDateShortcut('');
                  }}
                  className="w-full p-2 bg-[#0B0B12] border border-white/10 rounded-xl text-[13px] text-white outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">Budget / Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full p-2.5 bg-[#0B0B12] border border-white/10 rounded-xl text-[14px] text-white outline-none focus:border-[#7C3AED] placeholder-[#9CA3AF]"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full p-2.5 bg-[#0B0B12] border border-white/10 rounded-xl text-[14px] text-white outline-none focus:border-[#7C3AED] placeholder-[#9CA3AF]"
              />
            </div>
          </div>

          {/* Pass Availability */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#B5B8C5] block uppercase tracking-wider text-xs">Pass Availability</label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B12] border border-white/10 outline-none text-[15px] text-white cursor-pointer focus:border-[#7C3AED] transition-colors"
            >
              <option value="">All Pass Statuses</option>
              <option value="available">Available</option>
              <option value="nearly_sold_out">Nearly Sold Out</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
        </div>
      );
    };

    const renderExploreContent = () => {
      const filteredVenuesList = (venues || []).filter(v => {
        if (selectedCity && !v.address?.toLowerCase().includes(selectedCity.toLowerCase()) && !v.name?.toLowerCase().includes(selectedCity.toLowerCase())) return false;
        if (searchQuery && !v.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !v.address?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });

      return (
        <div className="space-y-10">
          {/* Welcome Banner */}
          <div className="p-6 md:p-8 rounded-[22px] bg-gradient-to-r from-[#181825] via-[#141420] to-[#181825] border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-center text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 w-fit">
              <span className="text-[13px] font-semibold text-[#7C3AED]">Welcome to EventSphere</span>
            </div>
            <h2 className="text-[30px] font-bold text-white tracking-tight">Hello, {user?.first_name || 'Guest'}!</h2>
            <p className="text-[16px] text-[#B5B8C5] max-w-xl leading-[1.6]">
              Book verified local party plots, browse live concerts, or buy entry passes for Ahmedabad festivals.
            </p>
          </div>

          {/* Single Unified Search Bar Pill */}
          <div className="relative max-w-4xl mx-auto w-full">
            <div className="relative flex items-center bg-[#181825] border border-white/10 rounded-full px-6 py-3 shadow-2xl hover:border-[#7C3AED]/50 focus-within:border-[#7C3AED] transition-all">
              <Search className="text-[#7C3AED] shrink-0 mr-3" size={22} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events or party plots..."
                className="w-full bg-transparent text-white text-lg md:text-xl placeholder-slate-400 font-medium py-1 border-0 border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none ring-0 caret-[#7C3AED]"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          {/* Explore Party Plots */}
          <div className="text-left space-y-6">
            <h3 className="text-[28px] font-bold text-white flex items-center gap-2.5">
              <MapPin className="text-[#7C3AED]" size={24} />
              Explore Party Plots
            </h3>
            {filteredVenuesList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVenuesList.map(v => {
                  const formattedVenuePrice = Math.round(parseFloat(v.price_per_day || 0)).toLocaleString('en-IN');
                  const formattedCapacity = parseInt(v.capacity || 0).toLocaleString('en-IN');

                  return (
                    <div key={v.id} className="bg-[#181825] border border-white/10 rounded-[20px] overflow-hidden flex flex-col h-full shadow-xl relative text-left group hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#7C3AED]/40 transition-all duration-300">
                      {/* Image Section */}
                      <div className="h-[200px] relative bg-[#141420] overflow-hidden rounded-t-[20px]">
                        <img src={v.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500'} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181825] via-transparent to-transparent opacity-80" />
                        
                        <button
                          onClick={() => handleWishlistToggle('venue', v.id)}
                          className="h-9 w-9 rounded-full bg-[#0B0B12]/70 backdrop-blur-md border border-white/10 text-[#B5B8C5] hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors z-10 absolute top-3 right-3 shadow-md"
                        >
                          <Heart size={15} className={wishlistedIds.includes(v.id) ? "fill-rose-500 text-rose-500" : ""} />
                        </button>
                      </div>

                      {/* Content Layout */}
                      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                        <div className="space-y-2">
                          <h4 className="text-[19px] font-bold text-white leading-snug line-clamp-1">{v.name}</h4>
                          <p className="text-[13px] font-normal text-[#9CA3AF] line-clamp-2 leading-relaxed h-[38px]">{v.description}</p>
                          
                          <div className="flex items-center gap-2 text-[13px] font-medium text-[#9CA3AF] pt-1">
                            <Users size={14} className="text-[#7C3AED] shrink-0" />
                            <span className="truncate">Capacity: {formattedCapacity} guests</span>
                          </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="pt-3.5 border-t border-white/10 flex justify-between items-center gap-2 mt-auto">
                          <div className="flex flex-col min-w-0 flex-1 justify-center text-left">
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">PER DAY</span>
                            <span className="text-[18px] font-extrabold text-white leading-tight truncate">₹{formattedVenuePrice}</span>
                          </div>
                          <button
                            onClick={() => openBookingModal(v)}
                            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-bold py-2.5 px-4 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center active:scale-95"
                          >
                            Book Venue
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#181825] border border-white/10 rounded-[22px] text-[#B5B8C5] text-[16px]">
                No party plots match your query.
              </div>
            )}
          </div>

          {/* Explore Local Events section */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10 pt-10 text-left">
              <div>
                <h3 className="text-[28px] font-bold text-white flex items-center gap-2.5">
                  <Calendar className="text-[#7C3AED]" size={24} />
                  Browse Local Festivals & Events
                </h3>
                <p className="text-[16px] text-[#B5B8C5] pt-0.5">Find concerts, garba nights, and technology workshops</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                {/* Sorting Select */}
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-[#181825] border border-white/10 outline-none text-[14px] text-white font-semibold cursor-pointer focus:border-[#7C3AED] transition-colors"
                >
                  <option value="">Sort: Default</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="date_asc">Date (Asc)</option>
                  <option value="date_desc">Date (Desc)</option>
                  <option value="price_asc">Price (Low-High)</option>
                  <option value="price_desc">Price (High-Low)</option>
                  <option value="popular">Most Booked</option>
                  <option value="highest_rated">Highest Rated</option>
                </select>

                {/* Mobile Filter Drawer trigger button */}
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(true)}
                  className="lg:hidden p-2.5 rounded-xl border border-white/10 hover:bg-[#181825] text-white cursor-pointer bg-[#141420]"
                  title="Open Filters"
                >
                  <TrendingUp size={18} />
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {(selectedCity || selectedCategoryFilter || selectedVenueType || selectedStatus || selectedAvailability || selectedDateShortcut || priceMin || priceMax || startDateFilter || endDateFilter) && (
              <div className="flex flex-wrap gap-2 text-left">
                {selectedCity && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    City: {selectedCity}
                    <button onClick={() => setSelectedCity('')} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {selectedCategoryFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Category: {selectedCategoryFilter}
                    <button onClick={() => setSelectedCategoryFilter('')} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {selectedVenueType && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Venue: {selectedVenueType}
                    <button onClick={() => setSelectedVenueType('')} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {selectedDateShortcut && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Date: {selectedDateShortcut}
                    <button onClick={() => setSelectedDateShortcut('')} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {(startDateFilter || endDateFilter) && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Dates: {startDateFilter || 'Any'} to {endDateFilter || 'Any'}
                    <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {(priceMin || priceMax) && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Price: ₹{priceMin || '0'} - ₹{priceMax || 'Max'}
                    <button onClick={() => { setPriceMin(''); setPriceMax(''); }} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
                {selectedAvailability && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181825] text-white text-[13px] font-medium border border-white/10">
                    Availability: {selectedAvailability}
                    <button onClick={() => setSelectedAvailability('')} className="text-[#9CA3AF] hover:text-white font-bold cursor-pointer">✕</button>
                  </span>
                )}
              </div>
            )}

            {/* Main Content Area: Events Grid */}
            <div className="w-full">
                {isFilterLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-[22px] border border-white/10 bg-[#181825] p-6 space-y-4 animate-pulse">
                        <div className="h-44 bg-[#141420] rounded-xl w-full animate-pulse" />
                        <div className="h-5 bg-[#141420] rounded w-2/3 animate-pulse" />
                        <div className="h-4 bg-[#141420] rounded w-1/2 animate-pulse" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-6 bg-[#141420] rounded w-1/4" />
                          <div className="h-10 bg-[#141420] rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  (() => {
                    const itemsPerPage = 6;
                    const hasActiveFilters = !!(
                      searchQuery || selectedCity || selectedCategoryFilter || selectedVenueType || 
                      selectedStatus || selectedAvailability || selectedDateShortcut || 
                      priceMin || priceMax || startDateFilter || endDateFilter
                    );

                    // Pagination computations
                    const totalPages = Math.ceil(events.length / itemsPerPage);
                    const paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                    return (
                      <div className="space-y-8">
                        {/* Floating Toast Notification */}
                        {shareToast.show && (
                          <div className="fixed bottom-8 right-8 z-50 p-4 bg-[#181825] text-white font-semibold text-xs rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10 animate-slide-up">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span>{shareToast.message}</span>
                          </div>
                        )}

                        {/* Trending & Recently Added Sections */}
                        {!hasActiveFilters && currentPage === 1 && (
                          <div className="space-y-10 mb-10 text-left">
                            {/* Trending Events */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <TrendingUp className="text-[#7C3AED] animate-pulse" size={20} />
                                <h3 className="text-[16px] font-bold text-white tracking-wider uppercase">Trending Events</h3>
                                <span className="text-[11px] bg-[#7C3AED]/20 text-purple-300 font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#7C3AED]/30">Fast Selling</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {events.slice(0, 3).map(e => renderEventCard(e))}
                              </div>
                            </div>

                            {/* Recently Added Events */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <Clock className="text-[#7C3AED]" size={20} />
                                <h3 className="text-[16px] font-bold text-white tracking-wider uppercase">Recently Added</h3>
                                <span className="text-[11px] bg-[#7C3AED]/20 text-purple-300 font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#7C3AED]/30">New</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[...events].reverse().slice(0, 3).map(e => renderEventCard(e))}
                              </div>
                            </div>

                            {/* Explore Section Heading */}
                            <div className="border-b border-white/10 pb-3 pt-4">
                              <h3 className="text-[16px] font-bold text-white tracking-wider uppercase">Explore All Listings</h3>
                            </div>
                          </div>
                        )}

                        {/* Main Listings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {paginatedEvents.map(e => renderEventCard(e))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-12 border-t border-white/10 pt-6">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => prev - 1)}
                              className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-[#B5B8C5] bg-[#181825] hover:bg-[#7C3AED] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                  currentPage === i + 1
                                    ? 'bg-[#7C3AED] text-white shadow-md'
                                    : 'border border-white/10 text-[#B5B8C5] bg-[#181825] hover:bg-[#7C3AED] hover:text-white'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => prev + 1)}
                              className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-[#B5B8C5] bg-[#181825] hover:bg-[#7C3AED] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-16 bg-[#181825] border border-white/10 rounded-[22px] p-8 max-w-md mx-auto my-4 space-y-4 shadow-xl">
                    <div className="w-16 h-16 bg-[#141420] rounded-full flex items-center justify-center mx-auto text-[#7C3AED] border border-white/10 shadow-inner">
                      <Search size={28} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-lg">No Events Found</h4>
                      <p className="text-sm text-[#B5B8C5] max-w-xs leading-relaxed mx-auto">
                        We couldn't find any events matching your selected filters. Try broadening your keywords or resetting filters.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCity('');
                        setSelectedCategoryFilter('');
                        setSelectedVenueType('');
                        setSelectedStatus('');
                        setSelectedAvailability('');
                        setSelectedDateShortcut('');
                        setStartDateFilter('');
                        setEndDateFilter('');
                        setPriceMin('');
                        setPriceMax('');
                        setSearchQuery('');
                      }}
                      className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-colors cursor-pointer shadow-md"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
      );
    };

    const navItems = [
      { id: 'explore', label: 'Explore Events & Plots', icon: Search },
      { id: 'bookings', label: 'My Bookings', icon: Ticket },
      { id: 'profile', label: 'My Profile', icon: User },
      { id: 'wishlist', label: 'Saved Wishlist', icon: Heart },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Account Settings', icon: Settings },
    ];

    const isStandalone = location.pathname === '/explore';

    return (
      <div className="w-full h-full text-slate-800 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch h-full overflow-hidden">
          
          {/* Left Column: Explore Filters only */}
          {dashboardTab === 'explore' && (
            <div className="w-full lg:w-64 shrink-0 lg:h-full select-none">
              <div className="hidden lg:block h-full">
                {renderFilterSidebar()}
              </div>
            </div>
          )}

          {/* Right Column: Dashboard Main Panel Body */}
          <div className="flex-grow w-full h-full overflow-y-auto pr-2 pb-12 min-h-0">
            {dashboardTab === 'explore' && renderExploreContent()}

            {dashboardTab === 'bookings' && (
              <div className="space-y-8">
                {/* My Event Bookings — All statuses */}
                <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl text-left">
                  <h3 className="font-extrabold text-white text-lg mb-6 flex items-center gap-2">
                    <Ticket className="text-[#7C3AED]" size={20} />
                    🎟️ My Event Bookings
                  </h3>
                  {myTicketBookings.length > 0 ? (
                    <div className="space-y-4">
                      {myTicketBookings.map(ticket => (
                        <div key={ticket.id} className="p-5 rounded-3xl border border-white/10 bg-[#141420] flex flex-col sm:flex-row justify-between items-start gap-6 relative overflow-hidden text-left">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-2xl pointer-events-none" />
                          
                          <div className="space-y-3 flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {ticket.event_details?.category}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                ticket.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                ticket.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border-white/10' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-white text-base">{ticket.event_details?.title}</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#9CA3AF] font-semibold pt-1">
                              <div>📅 Date: <span className="text-slate-200">{formatEventDate(ticket.event_details)}</span></div>
                              <div>🕒 Time: <span className="text-slate-200">{formatTimeAMPM(ticket.event_details?.time)}</span></div>
                              <div>🎟️ Tickets: <span className="text-slate-200">{ticket.tickets_count} passes</span></div>
                            </div>

                            <div className="text-xs text-[#9CA3AF]">
                              🔖 Ticket Category: <span className="font-bold text-white">{ticket.ticket_type_details?.name || 'General Admission'}</span>
                            </div>
                          </div>

                          {/* QR Code Column */}
                          {ticket.status === 'paid' && (
                            <div className="p-2 bg-white rounded-2xl border border-white/20 flex items-center justify-center shadow-md shrink-0 w-24 h-24 self-center">
                              <QRCodeCanvas
                                value={`TICKET-ID:${ticket.id}|EVENT:${ticket.event_details?.title}|QTY:${ticket.tickets_count}`}
                                size={80}
                                level="M"
                              />
                            </div>
                          )}

                          <div className="flex flex-col items-stretch sm:items-end justify-between self-stretch shrink-0 gap-4">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Total Amount</span>
                              <span className="font-black text-white text-lg">₹{parseFloat(ticket.total_price || 0).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex gap-2">
                              {ticket.status === 'paid' && (
                                <button
                                  onClick={() => handleDownloadPDF(ticket.id)}
                                  className="px-4 py-2 rounded-xl bg-[#181825] border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                >
                                  <Download size={14} />
                                  <span>Ticket PDF</span>
                                </button>
                              )}
                              {ticket.status === 'paid' && (
                                <button
                                  onClick={() => handleCancelTicketBooking(ticket.id)}
                                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-xs cursor-pointer transition-all"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#141420] border border-white/10 rounded-2xl text-[#9CA3AF] text-sm">
                      <AlertCircle className="mx-auto mb-2 text-[#7C3AED]" size={26} />
                      You haven't booked any event tickets.
                    </div>
                  )}
                </div>

                {/* My Venue Rentals — All statuses */}
                <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl text-left">
                  <h3 className="font-extrabold text-white text-lg mb-6 flex items-center gap-2">
                    <Landmark className="text-[#7C3AED]" size={20} />
                    🏢 My Venue Rentals
                  </h3>
                  {myBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3">Venue / Address</th>
                            <th className="pb-3">Booked Dates</th>
                            <th className="pb-3">Total Cost</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                          {myBookings.map(b => (
                            <tr key={b.id} className="hover:bg-white/[0.02]">
                              <td className="py-4">
                                <span className="block font-bold text-white">{b.venue_details?.name}</span>
                                <span className="text-xs text-[#9CA3AF]">{b.venue_details?.address}</span>
                              </td>
                              <td className="py-4 text-slate-300">
                                {b.start_date} to {b.end_date}
                              </td>
                              <td className="py-4 font-black text-white">₹{parseFloat(b.total_price || 0).toLocaleString('en-IN')}</td>
                              <td className="py-4">
                                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  b.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                  b.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                  b.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border-white/10' :
                                  'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                {b.status === 'approved' && !b.is_paid && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handlePayVenueRental(b)}
                                      className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer"
                                    >
                                      Pay Rental
                                    </button>
                                    <button
                                      onClick={() => handleCancelVenueBooking(b.id)}
                                      className="px-3 py-2 rounded-xl bg-[#141420] border border-white/10 hover:bg-white/10 text-white font-bold text-xs cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                                {(b.status === 'paid' || (b.status === 'approved' && b.is_paid)) && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleDownloadVenueInvoicePDF(b.id)}
                                      className="px-4 py-2 rounded-xl bg-[#141420] border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                    >
                                      <Download size={14} />
                                      <span>Invoice</span>
                                    </button>
                                    <button
                                      onClick={() => handleCancelVenueBooking(b.id)}
                                      className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-xs cursor-pointer transition-all"
                                    >
                                      Cancel & Refund
                                    </button>
                                  </div>
                                )}
                                {b.status === 'pending' && (
                                  <div className="flex justify-end gap-2 items-center">
                                    <span className="text-xs text-[#9CA3AF]">Waiting for approval</span>
                                    <button
                                      onClick={() => handleCancelVenueBooking(b.id)}
                                      className="px-3 py-1.5 rounded-xl border border-white/10 text-[#9CA3AF] hover:text-white hover:bg-white/10 text-xs font-bold cursor-pointer transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                                {b.status === 'rejected' && (
                                  <span className="text-xs text-rose-400 font-bold">Request Rejected</span>
                                )}
                                {b.status === 'cancelled' && (
                                  <span className="text-xs text-[#9CA3AF]">Cancelled / Refunded</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#141420] border border-white/10 rounded-2xl text-[#9CA3AF] text-sm">
                      <AlertCircle className="mx-auto mb-2 text-[#7C3AED]" size={26} />
                      You haven't requested any venue rentals.
                    </div>
                  )}
                </div>
              </div>
            )}

            {dashboardTab === 'profile' && (
              <div className="p-8 rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 text-left max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/10 pb-6 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shadow-purple-500/20 shrink-0">
                    {firstName ? firstName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h1 className="text-xl font-bold font-display text-white">
                      {firstName} {lastName}
                    </h1>
                    <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider bg-[#0B0B12] text-slate-300 border border-white/10">
                        {role ? role.replace('_', ' ') : 'Customer'}
                      </span>
                      {user?.is_email_verified ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          Verified Account
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                          <ShieldAlert size={12} />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!user?.is_email_verified && (
                  <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3 items-start">
                      <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-300 block text-sm mb-0.5">Please Verify Your Email</strong>
                        Verify your email address to complete ticket purchases and book party plot venues.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyEmailNow}
                      disabled={isVerifyingEmail}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isVerifyingEmail ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="animate-spin" size={14} />
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        'Verify Email Now'
                      )}
                    </button>
                  </div>
                )}

                {profileError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold text-center">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold text-center">
                    {profileSuccess}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Email Address (Read-only)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12]/60 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {dashboardTab === 'wishlist' && (
              <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 text-left">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-bold font-display text-white text-xl flex items-center gap-2.5">
                    <Heart className="text-pink-500 fill-pink-500" size={22} />
                    My Saved Wishlist
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Keep track of venues you want to rent or events you plan to attend.</p>
                </div>

                {isWishlistLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-pink-400" size={28} />
                  </div>
                ) : wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistItems.map(item => {
                      const isVenue = !!item.venue_details;
                      const detail = isVenue ? item.venue_details : item.event_details;
                      if (!detail) return null;
                      return (
                        <div key={item.id} className="p-4 rounded-2xl bg-[#0B0B12] border border-white/10 hover:border-pink-500/40 transition-all flex gap-4 relative group shadow-md">
                          <div className="h-20 w-24 rounded-xl overflow-hidden bg-[#151522] border border-white/10 shrink-0">
                            <img src={detail.images?.[0] || (isVenue ? 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500' : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500')} alt={detail.name || detail.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="min-w-0 flex-grow flex flex-col justify-between text-xs">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-white text-sm truncate font-display">{detail.name || detail.title}</h4>
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.post('/api/interactions/wishlist/toggle/', { [isVenue ? 'venue' : 'event']: detail.id });
                                      setWishlistItems(prev => prev.filter(i => i.id !== item.id));
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-[#151522] border border-white/10 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                                  title="Remove Saved Item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider bg-pink-500/10 text-pink-300 border border-pink-500/20 mt-1">
                                {isVenue ? 'Venue Plot' : 'Festival / Event'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-3 border-t border-white/10 pt-2.5 text-[10px] gap-2 flex-wrap sm:flex-nowrap">
                              <span className="font-medium text-slate-400 flex items-center gap-1">
                                <MapPin size={11} className="text-pink-400 shrink-0" />
                                <span className="truncate max-w-28">{detail.address || detail.venue_details?.address || 'Ahmedabad'}</span>
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-pink-400 text-xs shrink-0">
                                  {isVenue ? `₹${detail.price_per_day}/day` : (['Concert', 'Social / Garba'].includes(detail.category) ? 'Passes Available' : `₹${detail.ticket_price}`)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isVenue) {
                                      openBookingModal(detail);
                                    } else {
                                      setBookingEvent(detail);
                                      setTicketQty(1);
                                      setSelectedTicketType(null);
                                      fetchEventTicketTypes(detail.id);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-900/30 shrink-0"
                                >
                                  {isVenue ? 'Book Venue' : 'Book Event'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-14 border border-dashed border-white/10 rounded-3xl p-8 bg-[#0B0B12]/50 text-slate-400 text-xs">
                    <Heart className="mx-auto mb-2 text-pink-400/50" size={28} />
                    Your wishlist is empty. Browse events or venues to save them here!
                  </div>
                )}
              </div>
            )}

            {dashboardTab === 'notifications' && (
              <NotificationsPage />
            )}

            {dashboardTab === 'settings' && (
              <div className="space-y-8 text-left max-w-2xl mx-auto">
                {/* Title */}
                <div>
                  <h3 className="font-bold font-display text-white text-xl flex items-center gap-2.5">
                    <Settings className="text-purple-400" size={22} />
                    Account Settings
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Configure profile details, phone contacts, address records, and change your password.</p>
                </div>

                {/* Profile Settings Section (Avatar, Mobile, Address) */}
                <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
                  <span className="font-bold text-slate-300 text-xs uppercase tracking-wider block border-b border-white/10 pb-3">Profile Details</span>
                  
                  {profileSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold text-center animate-pulse">
                      {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold text-center animate-pulse">
                      {profileError}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-white/10 pb-6">
                    {/* Avatar Preview */}
                    <div className="relative group shrink-0">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B12] shadow-inner flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="text-slate-400" size={36} />
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAvatar(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="text-center sm:text-left space-y-1">
                      <h4 className="font-bold text-sm text-white font-display">Your Avatar Picture</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                        Upload a PNG or JPEG file. This picture will be displayed on your profile card and navbar.
                      </p>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold block pt-1 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Address</label>
                      <textarea
                        placeholder="Your residential address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Save Settings Changes</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Secure Password Update */}
                <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
                  <span className="font-bold text-slate-300 text-xs uppercase tracking-wider block border-b border-white/10 pb-3">Change Password</span>
                  
                  {settingsError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold text-center">
                      {settingsError}
                    </div>
                  )}
                  {settingsSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold text-center">
                      {settingsSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-[#0B0B12] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full sm:w-auto px-8 py-4 bg-[#0B0B12] border border-white/10 hover:border-pink-500/50 hover:bg-white/5 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. ORGANIZER PORTAL RENDER
  const renderOrganizerDashboard = () => {
    if (organizerSubView === 'book_venue') {
      return (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-[#181825] p-6 rounded-3xl border border-white/10 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-white font-sans">Book a Venue</h2>
              <p className="text-[#9CA3AF] text-xs mt-1">Select an approved party plot to request booking dates.</p>
            </div>
            <button
              onClick={() => setOrganizerSubView('dashboard')}
              className="px-4 py-2 rounded-xl bg-[#141420] hover:bg-white/5 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
            >
              Back to Dashboard
            </button>
          </div>
          {renderOrganizerVenueBooker()}
        </div>
      );
    }

    // Dynamic Stats calculation
    const paidBookings = organizerBookings.filter(b => b.status === 'paid');
    const ticketsSold = paidBookings.reduce((sum, b) => sum + b.tickets_count, 0);
    const totalEarnings = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const upcomingEvents = myEvents.filter(e => e.status === 'approved' && new Date(e.date) >= todayDate);
    const completedEvents = myEvents.filter(e => e.status === 'approved' && new Date(e.date) < todayDate);
    const cancelledEvents = myEvents.filter(e => e.status === 'rejected' || e.status === 'cancelled');

    const filteredMyEvents = myEvents.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(orgSearch.toLowerCase()) || 
                          e.description.toLowerCase().includes(orgSearch.toLowerCase());
      const matchCategory = !orgCategoryFilter || e.category.toLowerCase() === orgCategoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });

    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#181825] via-[#141420] to-[#181825] border border-white/10 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1 text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white">Organizer Portal</h2>
            <p className="text-[#9CA3AF] text-sm">
              Create local concerts, set ticket availability caps, and view live earnings stats.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOrganizerSubView('book_venue')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#141420] hover:bg-[#7C3AED] border border-white/10 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <MapPin size={16} />
              Book Venue
            </button>
            <Link
              to="/events/create"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              Create Event
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Total Events</span>
            <span className="text-2xl font-black text-white">{myEvents.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Published Events</span>
            <span className="text-2xl font-black text-emerald-400">
              {myEvents.filter(e => e.status === 'approved').length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Pending Approval</span>
            <span className="text-2xl font-black text-amber-400">
              {myEvents.filter(e => e.status === 'pending').length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Upcoming Events</span>
            <span className="text-2xl font-black text-blue-400">{upcomingEvents.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Tickets Sold</span>
            <span className="text-2xl font-black text-purple-400">{ticketsSold}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Revenue Generated</span>
            <span className="text-2xl font-black text-white">₹{totalEarnings.toLocaleString()}</span>
          </div>
        </div>

        {/* Manage Events Table */}
        <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="font-bold text-white text-lg">Manage Events</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search my events..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400 shadow-sm"
                />
              </div>
              <select
                value={orgCategoryFilter}
                onChange={(e) => setOrgCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white font-semibold cursor-pointer shadow-sm"
              >
                <option value="" className="bg-[#141420] text-white">All Categories</option>
                {['Concert', 'Festival', 'Conference', 'Social / Garba', 'Exhibition', 'Wedding'].map(cat => (
                  <option key={cat} value={cat} className="bg-[#141420] text-white">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredMyEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Event Name / Category</th>
                    <th className="pb-3">Schedule Date</th>
                    <th className="pb-3">Ticket Rate</th>
                    <th className="pb-3">Tickets (Sold/Total)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                  {filteredMyEvents.map(e => {
                    const soldForThisEvent = organizerBookings
                      .filter(b => b.event_details?.id === e.id && b.status === 'paid')
                      .reduce((sum, b) => sum + b.tickets_count, 0);

                    return (
                      <tr key={e.id} className="hover:bg-white/[0.02]">
                        <td className="py-4">
                          <span className="block font-bold text-white">{e.title}</span>
                          <span className="text-xs text-purple-300 uppercase tracking-wide bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-2 py-0.5 rounded-full inline-block mt-0.5">{e.category}</span>
                        </td>
                        <td className="py-4 text-slate-300">{formatEventDate(e)} ({formatTimeAMPM(e.time)})</td>
                        <td className="py-4 font-black text-white">
                          {['Concert', 'Social / Garba'].includes(e.category) ? (
                            <span className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider shadow-sm">
                              Category-Based Passes
                            </span>
                          ) : (
                            parseFloat(e.ticket_price) === 0 ? 'FREE' : `₹${parseFloat(e.ticket_price).toLocaleString()}`
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-white">{soldForThisEvent} / {e.total_tickets}</span>
                            <div className="h-1.5 w-24 bg-[#141420] rounded-full overflow-hidden border border-white/10">
                              <div 
                                className="h-full bg-[#7C3AED]" 
                                style={{ width: `${(soldForThisEvent / e.total_tickets) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider w-max ${
                              (new Date(e.date) < todayDate && e.status === 'approved') ? 'bg-slate-800/80 text-slate-300 border-slate-700' :
                              e.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                              e.status === 'rejected' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                              'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}>
                              {new Date(e.date) < todayDate && e.status === 'approved' ? 'Completed' :
                               e.status === 'approved' ? 'Published' :
                               e.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                            </span>
                            {e.status === 'rejected' && e.rejection_reason && (
                              <span className="text-[10px] text-rose-400 font-medium max-w-xs block leading-tight">
                                Reason: {e.rejection_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {e.status === 'rejected' && (
                              <button
                                onClick={() => handleResubmitEvent(e.id)}
                                title="Resubmit Event for Approval"
                                className="p-2 rounded-xl border border-white/10 bg-[#141420] text-amber-400 hover:border-amber-400 cursor-pointer flex items-center justify-center"
                              >
                                <RefreshCw size={15} className={actionLoading ? 'animate-spin' : ''} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedEventForSchedule(e);
                                fetchEventSchedule(e.id);
                                setScheduleModalError('');
                                setScheduleModalSuccess('');
                              }}
                              title="Manage Agenda Timeline"
                              className="p-2 rounded-xl border border-white/10 bg-[#141420] text-purple-300 hover:border-purple-400 cursor-pointer flex items-center justify-center"
                            >
                              <Clock size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEventForTickets(e);
                                fetchEventTicketTypes(e.id);
                                setModalError('');
                                setModalSuccess('');
                              }}
                              title="Manage Ticket Categories"
                              className="p-2 rounded-xl border border-white/10 bg-[#141420] text-blue-300 hover:border-blue-400 cursor-pointer flex items-center justify-center"
                            >
                              <Ticket size={15} />
                            </button>
                            <button
                              onClick={() => navigate(`/events/edit/${e.id}`)}
                              className="p-2 rounded-xl border border-white/10 bg-[#141420] text-slate-300 hover:text-white hover:border-[#7C3AED] cursor-pointer"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(e.id)}
                              className="p-2 rounded-xl border border-white/10 bg-[#141420] text-rose-400 hover:border-rose-500 cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#9CA3AF] text-sm">
              <AlertCircle className="mx-auto mb-2 text-slate-500" size={24} />
              {myEvents.length === 0 
                ? 'No events registered. Click "Create Event" to get started!'
                : 'No matching events found for search/filter criteria.'
              }
            </div>
          )}
        </div>

        {/* My Venue Bookings */}
        <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl text-left">
          <h3 className="font-bold text-white text-lg mb-6">My Venue Bookings</h3>
          {myBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Venue / Address</th>
                    <th className="pb-3">Booked Dates</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Payment Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                  {myBookings.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="py-4">
                        <span className="block font-bold text-white">{b.venue_details?.name}</span>
                        <span className="text-xs text-slate-400">{b.venue_details?.address}</span>
                      </td>
                      <td className="py-4 text-slate-300">{b.start_date} to {b.end_date}</td>
                      <td className="py-4 font-black text-white">₹{b.total_price}</td>
                      <td className="py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          b.status === 'approved' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                          b.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                          b.status === 'rejected' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                          b.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                          'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {b.status === 'paid' ? 'Confirmed' : b.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          b.is_paid ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {b.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {!b.is_paid && b.status !== 'cancelled' && b.status !== 'rejected' && (
                          <button
                            onClick={() => handlePayVenueRental(b)}
                            className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer active:scale-95"
                          >
                            Pay Rental
                          </button>
                        )}
                        {b.is_paid && (
                          <button
                            onClick={() => handleDownloadVenueInvoicePDF(b.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#141420] hover:bg-white/10 text-white border border-white/10 font-bold text-xs transition-all cursor-pointer"
                          >
                            Download Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">
              No venue bookings requested yet.
            </div>
          )}
        </div>

        {/* Detailed Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Lifecycles */}
          <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col space-y-6">
            <h3 className="font-bold text-white text-lg">Event Lifecycles</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider block mb-2">Upcoming Events ({upcomingEvents.length})</span>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {upcomingEvents.map(e => (
                      <div key={e.id} className="p-3.5 rounded-xl bg-[#141420] border border-white/10 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white block">{e.title}</span>
                          <span className="text-[10px] text-[#9CA3AF] font-semibold">{e.date} &bull; {e.category}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[9px] uppercase tracking-wide border border-emerald-500/30">Approved</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#9CA3AF] text-xs italic pl-1">No upcoming scheduled events.</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider block mb-2">Completed Events ({completedEvents.length})</span>
                {completedEvents.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {completedEvents.map(e => (
                      <div key={e.id} className="p-3.5 rounded-xl bg-[#141420] border border-white/10 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-300 block">{e.title}</span>
                          <span className="text-[10px] text-[#9CA3AF] font-semibold">{e.date} &bull; {e.category}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-extrabold text-[9px] uppercase tracking-wide border border-slate-700">Past</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#9CA3AF] text-xs italic pl-1">No completed events.</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider block mb-2">Cancelled & Rejected ({cancelledEvents.length})</span>
                {cancelledEvents.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {cancelledEvents.map(e => (
                      <div key={e.id} className="p-3.5 rounded-xl bg-[#141420] border border-white/10 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-400 block line-through">{e.title}</span>
                          <span className="text-[10px] text-[#9CA3AF] font-semibold">{e.date} &bull; {e.category}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-extrabold text-[9px] uppercase tracking-wide border border-rose-500/30">{e.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#9CA3AF] text-xs italic pl-1">No cancelled or rejected events.</span>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Sales & Revenue Summary */}
          <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg mb-6">Sales & Revenue Breakdown</h3>
              
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {myEvents.map(e => {
                  const soldForThisEvent = organizerBookings
                    .filter(b => b.event_details?.id === e.id && b.status === 'paid')
                    .reduce((sum, b) => sum + b.tickets_count, 0);
                  const revForThisEvent = soldForThisEvent * parseFloat(e.ticket_price || 0);

                  return (
                    <div key={e.id} className="flex justify-between items-center border-b border-white/10 pb-3 text-xs">
                      <div>
                        <span className="font-bold text-white block">{e.title}</span>
                        <span className="text-[10px] text-[#9CA3AF] font-semibold">
                          Tickets Sold: {soldForThisEvent} / {e.total_tickets} ({Math.round((soldForThisEvent / e.total_tickets) * 100) || 0}%)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-400 block">₹{revForThisEvent.toLocaleString()}</span>
                        <span className="text-[9px] text-[#9CA3AF] font-bold">
                          {['Concert', 'Social / Garba'].includes(e.category) ? 'Category-Based Passes' : `@ ₹${e.ticket_price} each`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {myEvents.length === 0 && (
                  <div className="text-center text-[#9CA3AF] text-xs py-8">No registered events.</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[#9CA3AF] text-[10px] font-black uppercase tracking-wider block">Total Consolidated Revenue</span>
                <span className="text-2xl font-black text-emerald-400">₹{totalEarnings.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[#9CA3AF] text-[10px] font-black uppercase tracking-wider block">Tickets Sold</span>
                <span className="text-lg font-extrabold text-white">{ticketsSold} tickets</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  };
  const renderPlotOwnerDashboard = () => {
    // Calculate Payout Earnings
    const completedPayouts = paymentsHistory
      .filter(p => p.booking_type === 'venue' && p.status === 'completed');
    const totalEarnings = completedPayouts.reduce((sum, p) => sum + p.amount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const pendingRequests = bookingRequests.filter(r => r.status === 'pending');
    const upcomingBookings = bookingRequests.filter(r => ['approved', 'paid'].includes(r.status) && r.start_date > todayStr);
    const todayBookings = bookingRequests.filter(r => {
      if (!['approved', 'paid'].includes(r.status)) return false;
      return todayStr >= r.start_date && todayStr <= r.end_date;
    });

    // Populate booked and pending dates sets
    const bookedDates = new Set();
    const pendingDates = new Set();
    bookingRequests.forEach(req => {
      let curr = new Date(req.start_date);
      const end = new Date(req.end_date);
      const isApprovedOrPaid = ['approved', 'paid', 'completed'].includes(req.status);
      const isPending = req.status === 'pending';
      while (curr <= end) {
        const dateKey = curr.toISOString().split('T')[0];
        if (isApprovedOrPaid) {
          bookedDates.add(dateKey);
        } else if (isPending) {
          pendingDates.add(dateKey);
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const currentYear = calendarDate.getFullYear();
    const currentMonth = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const calendarGrid = [];
    for (let i = 0; i < firstDay; i++) {
      calendarGrid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      calendarGrid.push(d);
    }

    const prevMonth = () => {
      setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
      setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    };

    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#181825] via-[#141420] to-[#181825] border border-white/10 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-white">Plot Owner Dashboard</h2>
            <p className="text-[#9CA3AF] text-sm">
              Manage listings, review incoming booking reservations, and track payouts.
            </p>
          </div>
          <Link
            to="/venues/create"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            Register Party Plot
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Total Plots</span>
            <span className="text-2xl font-black text-white">{myPlots.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Approved Plots</span>
            <span className="text-2xl font-black text-emerald-400">
              {myPlots.filter(p => p.approval_status === 'approved').length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Pending Approval</span>
            <span className="text-2xl font-black text-amber-400">
              {myPlots.filter(p => p.approval_status === 'pending').length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Pending Bookings</span>
            <span className="text-2xl font-black text-blue-400">{pendingRequests.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl text-left flex flex-col justify-between min-h-24">
            <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Upcoming Rentals</span>
            <span className="text-2xl font-black text-purple-400">{upcomingBookings.length}</span>
          </div>
        </div>

        {/* My Listed Venues Table */}
        <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl text-left">
          <h3 className="font-bold text-white text-lg mb-6">Listed Party Plots</h3>
          {myPlots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Plot Name / Address</th>
                    <th className="pb-3">Daily Rent</th>
                    <th className="pb-3">Capacity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                  {myPlots.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-4">
                        <span className="block font-bold text-white">{p.name}</span>
                        <span className="text-xs text-slate-400">{p.address}</span>
                      </td>
                      <td className="py-4 font-black text-white">₹{p.price_per_day}</td>
                      <td className="py-4 text-slate-300">{p.capacity} guests</td>
                      <td className="py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            p.approval_status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                            p.approval_status === 'rejected' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}>
                            {p.approval_status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/venues/edit/${p.id}`)}
                            className="p-2 rounded-xl border border-white/10 bg-[#141420] text-slate-300 hover:text-white hover:border-[#7C3AED] cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">
              No party plots listed.
            </div>
          )}
        </div>

        {/* 3-Column Lifecycle Dashboard Widget Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          
          {/* Column 1: Today's Bookings & Upcoming Bookings */}
          <div className="space-y-6">
            
            {/* Today's Bookings */}
            <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#7C3AED] animate-ping" />
                Today's Rentals ({todayBookings.length})
              </h3>
              {todayBookings.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {todayBookings.map(req => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-[#141420] border border-white/10 flex flex-col gap-1.5 text-xs">
                      <span className="block font-bold text-white">{req.venue_details?.name}</span>
                      <div className="flex justify-between text-[#9CA3AF] font-semibold text-[10px]">
                        <span>Client: {req.customer?.email?.split('@')[0]}</span>
                        <span className="text-emerald-400">Rate: ₹{req.total_price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#9CA3AF] text-xs italic">
                  No rentals scheduled for today.
                </div>
              )}
            </div>

            {/* Upcoming Bookings */}
            <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-400" />
                Upcoming Bookings ({upcomingBookings.length})
              </h3>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {upcomingBookings.map(req => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-[#141420] border border-white/10 flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="block font-bold text-white">{req.venue_details?.name}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                          req.status === 'paid' ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-blue-300 bg-blue-500/20 border-blue-500/30'
                        }`}>
                          {req.status === 'paid' ? 'Confirmed' : 'Approved'}
                        </span>
                      </div>
                      <div className="text-[#9CA3AF] text-[10px] space-y-0.5">
                        <p>Dates: <strong className="text-white">{req.start_date} to {req.end_date}</strong></p>
                        <p>Client: {req.customer?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9CA3AF] text-xs italic">
                  No upcoming bookings.
                </div>
              )}
            </div>

          </div>

          {/* Column 2: Pending Requests */}
          <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-400" />
              Pending Requests ({pendingRequests.length})
            </h3>
            {pendingRequests.length > 0 ? (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block font-bold text-xs text-white">{req.venue_details?.name}</span>
                        <span className="text-[10px] text-[#9CA3AF] font-semibold">{req.customer?.email}</span>
                      </div>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">Pending</span>
                    </div>

                    <div className="text-[10px] text-[#9CA3AF] flex justify-between font-semibold">
                      <span>Rentals: <strong className="text-white">{req.start_date} to {req.end_date}</strong></span>
                      <span>Total: <strong className="text-emerald-400">₹{req.total_price}</strong></span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookingRequest(req.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] shadow transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleBookingRequest(req.id, 'rejected')}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-[#141420] hover:bg-white/5 text-rose-400 border border-white/10 font-extrabold text-[10px] transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#9CA3AF] text-xs italic flex-grow flex items-center justify-center">
                No pending requests.
              </div>
            )}
          </div>

          {/* Column 3: Simple Availability Calendar */}
          <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#7C3AED]" />
                Availability Grid
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1 rounded bg-[#141420] border border-white/10 text-white hover:bg-white/10 text-xs font-bold cursor-pointer">◀</button>
                <span className="text-[10px] font-black text-white min-w-20 text-center uppercase tracking-wide">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button onClick={nextMonth} className="p-1 rounded bg-[#141420] border border-white/10 text-white hover:bg-white/10 text-xs font-bold cursor-pointer">▶</button>
              </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 flex-grow">
              {calendarGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg" />;
                }

                // Check if booked or pending
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isBooked = bookedDates.has(dateStr);
                const isPending = pendingDates.has(dateStr);

                return (
                  <div 
                    key={`day-${day}`} 
                    title={isBooked ? `Booked on ${dateStr}` : isPending ? `Pending Approval on ${dateStr}` : `Available on ${dateStr}`}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors select-none ${
                      isBooked 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] font-extrabold text-[#9CA3AF] uppercase tracking-wide">
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded bg-rose-500/30 border border-rose-500/50" />
                <span>Booked</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transaction History Log for Plot Owners */}
        <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl">
          <h3 className="font-bold text-white text-lg mb-6">Payout History</h3>
          {paymentsHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Transaction ID</th>
                    <th className="pb-3">Rental Venue</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Payout Status</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                  {paymentsHistory.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-4 font-mono text-xs text-slate-400">{p.transaction_id}</td>
                      <td className="py-4 font-bold text-white">{p.booking_name}</td>
                      <td className="py-4 font-black text-emerald-400">₹{p.amount}</td>
                      <td className="py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                          p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 text-right text-xs text-slate-400 font-semibold">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">
              No transaction history recorded yet.
            </div>
          )}
        </div>
      </div>
    );
  };
  const isDashboardLayout = ['customer', 'plot_owner', 'organizer', 'admin'].includes(role) || location.pathname === '/explore';

  return (
    <div className={isDashboardLayout 
      ? "max-w-7xl mx-auto px-4 md:px-8 h-[calc(100vh-73px)] overflow-hidden flex flex-col pt-6 pb-2" 
      : "max-w-7xl mx-auto px-4 py-12 md:px-8"
    }>
      {/* Global Error Banner — shows approve/reject failures, date conflicts etc */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-xl">
          <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
          <div className="flex-grow">
            <p className="text-rose-200 font-bold text-sm">Action Requirement</p>
            <p className="text-rose-300 text-xs mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white cursor-pointer font-bold text-xs shrink-0">✕</button>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutDetails.isOpen}
        onClose={() => setCheckoutDetails({ ...checkoutDetails, isOpen: false })}
        bookingType={checkoutDetails.bookingType}
        bookingId={checkoutDetails.bookingId}
        initialAmount={checkoutDetails.amount}
        onSuccess={() => {
          fetchData();
        }}
      />

      {/* Official Razorpay Payment Receipt Modal */}
      <AnimatePresence>
        {receiptModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 text-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-left space-y-6"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Official Payment Receipt</span>
                  <h3 className="text-xl font-bold font-display text-white">{receiptModalData.receipt_id}</h3>
                  <p className="text-xs text-slate-400">{receiptModalData.date}</p>
                </div>
                <button
                  onClick={() => setReceiptModalData(null)}
                  className="p-1.5 rounded-lg bg-[#141420] border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#0B0B12] border border-white/10 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Customer:</span>
                    <strong className="text-white">{receiptModalData.customer_name} ({receiptModalData.customer_email})</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Item Booked:</span>
                    <strong className="text-purple-300 font-bold">{receiptModalData.booking_name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Type:</span>
                    <span className="uppercase font-semibold text-slate-300">{receiptModalData.booking_type === 'event' ? 'Event Ticket' : 'Venue Rental'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Status:</span>
                    <span className="text-emerald-400 font-extrabold uppercase">{receiptModalData.status}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0B12] border border-white/10 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Razorpay Order ID:</span>
                    <span className="text-white">{receiptModalData.razorpay_order_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Razorpay Payment ID:</span>
                    <span className="text-white">{receiptModalData.razorpay_payment_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Signature Verification:</span>
                    <span className="text-emerald-400 font-semibold">Verified HMAC SHA256</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total Amount Paid:</span>
                  <span className="text-xl font-black text-[#7C3AED]">₹{receiptModalData.amount?.toLocaleString('en-IN')} {receiptModalData.currency}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  <span>Print / Save Receipt PDF</span>
                </button>
                <button
                  onClick={() => setReceiptModalData(null)}
                  className="px-5 py-3 rounded-2xl bg-[#141420] border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Venue Rental Request Modal */}
      <AnimatePresence>
        {bookingVenue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 text-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
            >
              <h3 className="text-xl font-black text-white mb-1">Request Venue Rental</h3>
              <p className="text-xs text-[#9CA3AF] mb-4">Book: <strong className="text-white">{bookingVenue.name}</strong></p>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                  {modalSuccess}
                </div>
              )}

              <form onSubmit={handleCreateBooking}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Form Inputs */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[#9CA3AF] text-[10px] font-bold uppercase pl-1 block">Start Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#9CA3AF] text-[10px] font-bold uppercase pl-1 block">End Date</label>
                        <input
                          type="date"
                          min={startDate || new Date().toISOString().split('T')[0]}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#141420] border border-white/10 rounded-2xl flex justify-between items-center text-xs text-slate-300 font-bold">
                      <span>Estimated Total Price:</span>
                      <span className="text-[#7C3AED] text-base font-black">₹{getEstimatedPrice().toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? 'Sending...' : 'Confirm Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingVenue(null)}
                        className="flex-1 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-white border border-white/10 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Mini Calendar */}
                  <div>
                    <VenueCalendar 
                      events={calendarEvents}
                      selectable={true}
                      onDateSelect={handleCalendarDateSelect}
                      role="customer"
                    />
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Venue Owner Calendar & Maintenance Modal */}
      <AnimatePresence>
        {selectedVenueForCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 text-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <button
                onClick={() => setSelectedVenueForCalendar(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>

              <div className="mb-4">
                <h3 className="text-xl font-black text-white">Calendar & Maintenance Console</h3>
                <p className="text-xs text-[#9CA3AF]">Venue: <strong className="text-white">{selectedVenueForCalendar.name}</strong></p>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                  {modalSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Calendar (2/3 width) */}
                <div className="lg:col-span-2">
                    <VenueCalendar 
                      events={calendarEvents}
                      selectable={true}
                      onDateSelect={handleCalendarDateSelect}
                    onEventClick={(fcEvent) => {
                      setSelectedEventDetails(fcEvent.extendedProps);
                    }}
                    role="plot_owner"
                  />
                </div>

                {/* Right Side: Operations Panel (1/3 width) */}
                <div className="space-y-6">
                  {/* Event Details card */}
                  {selectedEventDetails ? (
                    <div className="p-4 rounded-2xl border border-white/10 bg-[#141420] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Selected Event</span>
                        <button 
                          onClick={() => setSelectedEventDetails(null)}
                          className="text-xs text-[#7C3AED] hover:text-purple-300 font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {selectedEventDetails.type === 'booking' ? (
                        <div className="space-y-2 text-xs text-slate-300">
                          <p className="font-bold text-white text-sm">Customer Booking</p>
                          <p><strong>Customer:</strong> {selectedEventDetails.customer_name || 'N/A'}</p>
                          <p><strong>Email:</strong> {selectedEventDetails.customer_email || 'N/A'}</p>
                          <p><strong>Dates:</strong> {selectedEventDetails.start_date} to {selectedEventDetails.end_date}</p>
                          <p><strong>Total Price:</strong> ₹{selectedEventDetails.total_price?.toLocaleString('en-IN')}</p>
                          <p>
                            <strong>Status:</strong>{' '}
                            <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                              selectedEventDetails.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              selectedEventDetails.status === 'paid' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {selectedEventDetails.status}
                            </span>
                          </p>

                          {selectedEventDetails.status === 'pending' && (
                            <div className="flex gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => handleApproveBookingRequest(selectedEventDetails.booking_id, selectedVenueForCalendar.id)}
                                disabled={actionLoading}
                                className="flex-grow py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectBookingRequest(selectedEventDetails.booking_id, selectedVenueForCalendar.id)}
                                disabled={actionLoading}
                                className="flex-grow py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs text-slate-300">
                          <p className="font-bold text-rose-400 text-sm">Maintenance Period</p>
                          <p><strong>Reason:</strong> {selectedEventDetails.reason}</p>
                          <p><strong>Dates:</strong> {selectedEventDetails.start_date} to {selectedEventDetails.end_date}</p>
                          
                          <button
                            onClick={() => handleDeleteMaintenanceDay(selectedEventDetails.maintenance_id, selectedVenueForCalendar.id)}
                            disabled={actionLoading}
                            className="w-full mt-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Remove Maintenance
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-white/10 bg-[#141420] text-center py-8 text-[#9CA3AF] text-xs">
                      Click any event on the calendar to view its details.
                    </div>
                  )}

                  {/* Schedule Maintenance form */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-[#141420] space-y-4">
                    <h4 className="font-bold text-white text-sm">Schedule Maintenance</h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Start Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 rounded-xl bg-[#181825] border border-white/10 text-xs text-white outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">End Date</label>
                          <input
                            type="date"
                            min={startDate || new Date().toISOString().split('T')[0]}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 rounded-xl bg-[#181825] border border-white/10 text-xs text-white outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Reason</label>
                        <input
                          type="text"
                          placeholder="Lawn renovation, electrical repairs..."
                          value={maintenanceReason}
                          onChange={(e) => setMaintenanceReason(e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#181825] border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-[#7C3AED]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateMaintenanceDay}
                        disabled={actionLoading || !startDate || !endDate}
                        className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? 'Scheduling...' : 'Block Calendar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Ticket Purchasing Modal */}
      <AnimatePresence>
        {bookingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-[#181825] border border-white/10 text-white rounded-3xl p-6 ${bookingEvent.is_live_external ? 'max-w-sm' : 'max-w-2xl'} w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left`}
            >
              <h3 className="text-xl font-black text-white mb-1">Book Entry Passes</h3>
                 {/* Tab Switcher */}
              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center animate-shake">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateTicketBooking} className="space-y-6">
                {!bookingEvent.is_live_external && (
                  <div className="space-y-4">
                    <label className="text-[#9CA3AF] text-[10px] font-bold uppercase pl-1 block">Select Ticket Category</label>
                    {eventTicketTypes.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-[#9CA3AF] text-xs">
                        No ticket categories are currently active for this event.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eventTicketTypes.map((ticket) => {
                          const isSoldOut = ticket.remaining_quantity === 0;
                          const isExpired = new Date(ticket.sale_end) < new Date();
                          const isDisabled = isSoldOut || isExpired || ticket.status !== 'active';
                          const isSelected = selectedTicketType?.id === ticket.id;

                          const tName = ticket.name.toLowerCase();
                          let dotColor = '#22C55E';
                          let subtitle = 'Budget Option';
                          let subtitleColorClass = 'text-emerald-400';

                          if (tName.includes('vip') || ticket.color === 'amber') {
                            dotColor = '#7C3AED';
                            subtitle = 'Most Popular';
                            subtitleColorClass = 'text-purple-400';
                          } else if (tName.includes('deluxe') || ticket.color === 'purple') {
                            dotColor = '#EAB308';
                            subtitle = 'Luxury Experience';
                            subtitleColorClass = 'text-amber-400';
                          }

                          return (
                            <div
                              key={ticket.id}
                              onClick={() => !isDisabled && setSelectedTicketType(ticket)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                                isDisabled ? 'opacity-40 cursor-not-allowed border-white/10 bg-[#141420]' : 
                                isSelected ? 'border-[#7C3AED] bg-[#7C3AED]/15 shadow-xl scale-[1.01]' : 'border-white/10 hover:border-white/30 bg-[#141420] cursor-pointer'
                                }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5 font-black text-white text-sm leading-tight">
                                    <span style={{ color: dotColor }} className="text-xs leading-none">●</span>
                                    <span>{ticket.name}</span>
                                  </div>
                                  <span className={`block text-[11px] font-medium mt-0.5 ${subtitleColorClass}`}>
                                    {subtitle}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-black text-white text-sm">₹{parseFloat(ticket.price).toLocaleString('en-IN')}</span>
                                  <span className="text-[8px] text-[#9CA3AF] block font-semibold">{ticket.remaining_quantity} left</span>
                                </div>
                              </div>
                              {ticket.description && (
                                <p className="text-[10px] text-slate-300 leading-normal border-t border-white/10 pt-1.5 mt-1.5">{ticket.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2 text-left">
                      <label className="text-[#9CA3AF] text-[10px] font-bold uppercase pl-1">Passes Quantity</label>
                      <select
                        value={ticketQty}
                        onChange={(e) => setTicketQty(parseInt(e.target.value))}
                        className="w-full px-3 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs font-semibold text-white cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3.5 bg-[#141420] border border-white/10 rounded-2xl flex flex-col justify-center text-xs text-slate-300 font-bold h-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#9CA3AF]">Rate:</span>
                        <span>₹{(selectedTicketType ? parseFloat(selectedTicketType.price) : bookingEvent.ticket_price).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-1.5 mt-1 text-white">
                        <span>Total Price:</span>
                        <span className="text-base font-black text-[#7C3AED]">
                          ₹{((selectedTicketType ? parseFloat(selectedTicketType.price) : bookingEvent.ticket_price) * ticketQty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={actionLoading || (!bookingEvent.is_live_external && !selectedTicketType)}
                      className="flex-grow py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Proceed to Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingEvent(null)}
                      className="py-3 px-6 rounded-2xl bg-[#141420] hover:bg-white/10 text-white border border-white/10 font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Event Review Details Modal */}
      <AnimatePresence>
        {selectedAdminEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <button
                onClick={() => setSelectedAdminEvent(null)}
                className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedAdminEvent.category}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">{selectedAdminEvent.title}</h3>
                  <p className="text-xs text-[#9CA3AF] mt-1">Proposed by: <strong className="text-white">{selectedAdminEvent.organizer?.email}</strong></p>
                </div>

                {selectedAdminEvent.images && selectedAdminEvent.images.length > 0 && (
                  <div className="h-44 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#141420]">
                    <img 
                      src={selectedAdminEvent.images[0]} 
                      alt={selectedAdminEvent.title} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2 text-xs text-slate-300 font-medium leading-relaxed bg-[#141420] p-4 rounded-2xl border border-white/10">
                  <p><strong className="text-white">Description:</strong> {selectedAdminEvent.description}</p>
                  <p><strong className="text-white">Schedule Date:</strong> {formatEventDate(selectedAdminEvent)} at {formatTimeAMPM(selectedAdminEvent.time)}</p>
                  <p>
                    <strong className="text-white">Ticket Price:</strong>{' '}
                    {['Concert', 'Social / Garba'].includes(selectedAdminEvent.category)
                      ? 'Category-Based Passes'
                      : `₹${parseFloat(selectedAdminEvent.ticket_price || 0).toLocaleString('en-IN')} (Total passes: ${selectedAdminEvent.total_tickets})`}
                  </p>
                  {selectedAdminEvent.venue_details && (
                    <p><strong className="text-white">Venue Location:</strong> {selectedAdminEvent.venue_details.name} ({selectedAdminEvent.venue_details.address})</p>
                  )}
                  <p className="flex items-center gap-2">
                    <strong className="text-white">Current Status:</strong>{' '}
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      selectedAdminEvent.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      selectedAdminEvent.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {selectedAdminEvent.status}
                    </span>
                  </p>
                  {selectedAdminEvent.status === 'rejected' && selectedAdminEvent.rejection_reason && (
                    <p className="text-rose-300 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      Rejection Reason: {selectedAdminEvent.rejection_reason}
                    </p>
                  )}
                </div>

                {selectedAdminEvent.status === 'pending' && (
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[#9CA3AF] text-[10px] font-bold uppercase pl-1 block">Specify Rejection Reason (If rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="E.g., Incomplete description or duplicate listing..."
                        rows={2}
                        className="w-full p-3 text-xs rounded-xl bg-[#141420] border border-white/10 text-white placeholder-slate-400 outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveEvent(selectedAdminEvent.id)}
                        disabled={actionLoading}
                        className="flex-grow py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleRejectEvent(selectedAdminEvent.id)}
                        disabled={actionLoading}
                        className="flex-grow py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Organizer Manage Ticket Pass Categories Modal */}
      <AnimatePresence>
        {selectedEventForTickets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <button
                onClick={() => {
                  setSelectedEventForTickets(null);
                  setEditingTicketTypeId(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Ticket size={20} className="text-primary-500" />
                <h3 className="text-xl font-black text-slate-850">Manage Pass Categories</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Event: <strong>{selectedEventForTickets.title}</strong>
              </p>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold text-center">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-xs font-semibold text-center">
                  {modalSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Configured Pass Tiers (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Configured Passes ({eventTicketTypes.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleSeedStandardPasses(selectedEventForTickets)}
                      disabled={actionLoading}
                      className="text-[11px] font-extrabold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1 rounded-xl transition-all cursor-pointer"
                    >
                      ⚡ Add 3 Passes (General, VIP, Deluxe)
                    </button>
                  </div>

                  {eventTicketTypes.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      No pass categories configured yet. Create custom passes on the right or click "Add 3 Passes"!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                      {eventTicketTypes.map(t => {
                        const badgeColors = {
                          green: 'bg-green-50 text-green-700 border-green-200',
                          amber: 'bg-amber-50 text-amber-700 border-amber-200',
                          purple: 'bg-purple-50 text-purple-700 border-purple-200',
                          blue: 'bg-blue-50 text-blue-700 border-blue-200',
                          red: 'bg-red-50 text-red-700 border-red-200'
                        }[t.color] || 'bg-blue-50 text-blue-700 border-blue-200';

                        return (
                          <div key={t.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2 relative group">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-slate-850">{t.name}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColors}`}>
                                    {t.color}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-450 font-semibold">{t.remaining_quantity} / {t.total_quantity} passes available</span>
                              </div>
                              <span className="font-black text-slate-850 text-base">₹{parseFloat(t.price).toLocaleString()}</span>
                            </div>

                            {t.description && (
                              <p className="text-xs text-slate-500">{t.description}</p>
                            )}

                            {t.benefits && t.benefits.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {t.benefits.map((b, idx) => (
                                  <span key={idx} className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                    ✓ {b}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTicketTypeId(t.id);
                                  setTicketName(t.name);
                                  setTicketDesc(t.description || '');
                                  setTicketPrice(t.price);
                                  setTicketTotalQty(t.total_quantity);
                                  setTicketMaxPerUser(t.max_per_user || 10);
                                  setTicketBenefits(t.benefits ? t.benefits.join(', ') : '');
                                  setTicketColor(t.color || 'blue');
                                  setTicketStatus(t.status || 'active');
                                }}
                                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTicketType(t.id, selectedEventForTickets.id)}
                                className="px-3 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Form to create or update pass (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {editingTicketTypeId ? 'Edit Pass Category' : 'Create Custom Pass Category'}
                    </h4>
                    {editingTicketTypeId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTicketTypeId(null);
                          setTicketName('');
                          setTicketDesc('');
                          setTicketPrice(0);
                          setTicketTotalQty(100);
                          setTicketBenefits('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveTicketType} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-600 font-bold uppercase text-[9px]">Pass Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. General Pass, VIP Pass, Deluxe Pass"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold uppercase text-[9px]">Price (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 299"
                          value={ticketPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseFloat(val) >= 0) setTicketPrice(val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-medium"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold uppercase text-[9px]">Total Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 500"
                          value={ticketTotalQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) >= 0) setTicketTotalQty(val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold uppercase text-[9px]">Tag Color</label>
                        <select
                          value={ticketColor}
                          onChange={(e) => setTicketColor(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-semibold cursor-pointer"
                        >
                          <option value="green">🟢 Green (General)</option>
                          <option value="amber">🟡 Amber (VIP)</option>
                          <option value="purple">🟣 Purple (Deluxe)</option>
                          <option value="blue">🔵 Blue (Standard)</option>
                          <option value="red">🔴 Red (Special)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold uppercase text-[9px]">Status</label>
                        <select
                          value={ticketStatus}
                          onChange={(e) => setTicketStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-semibold cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 font-bold uppercase text-[9px]">Benefits (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Main Lawn Access, VIP Parking, Food Voucher"
                        value={ticketBenefits}
                        onChange={(e) => setTicketBenefits(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 font-bold uppercase text-[9px]">Pass Description</label>
                      <textarea
                        placeholder="Details about what is included in this pass..."
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-primary-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {actionLoading ? 'Saving...' : editingTicketTypeId ? 'Update Pass Category' : 'Save Pass Category'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Dashboard Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full overflow-hidden flex flex-col flex-grow min-h-0"
      >
        <div className="h-full overflow-hidden flex flex-col flex-grow min-h-0">
          {role === 'customer' && renderCustomerDashboard()}
          {role === 'organizer' && (
            <div className="flex-grow w-full h-full overflow-y-auto pr-2 pb-12 min-h-0">
              {renderOrganizerDashboard()}
            </div>
          )}
          {role === 'plot_owner' && (
            <div className="flex-grow w-full h-full overflow-y-auto pr-2 pb-12 min-h-0">
              {renderPlotOwnerDashboard()}
            </div>
          )}
          {role === 'admin' && (
            <div className="flex-grow w-full h-full overflow-y-auto pr-2 pb-12 min-h-0">
              <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-800 to-slate-950 text-white flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black">Admin Control Panel</h2>
                  <p className="text-slate-400 text-sm mt-1">Review system logs, venue posts, and moderate event listings.</p>
                </div>
                {/* Tab buttons */}
                <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl w-max">
                  <button
                    onClick={() => setAdminTab('overview')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${adminTab === 'overview' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
                  >
                    System Overview
                  </button>
                  <button
                    onClick={() => setAdminTab('listings')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${adminTab === 'listings' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
                  >
                    System Listings
                  </button>
                  <button
                    onClick={() => setAdminTab('event_approvals')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${adminTab === 'event_approvals' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
                  >
                    Event Approvals
                  </button>
                  <button
                    onClick={() => setAdminTab('users')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${adminTab === 'users' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
                  >
                    User Management
                  </button>
                  <button
                    onClick={() => navigate('/admin/analytics')}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-white hover:bg-white/5 flex items-center gap-1"
                  >
                    Platform Analytics
                  </button>
                </div>
              </div>

              {adminTab === 'overview' && (() => {
                const recentUsers = usersList.slice(0, 4).map(u => ({
                  name: u.first_name || u.email.split('@')[0],
                  email: u.email,
                  role: u.role,
                  date: u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'
                }));

                const recentContacts = [
                  { name: "Suresh Trivedi", email: "suresh.t@gmail.com", subject: "Sabarmati Riverfront lawn slot", message: "Is the riverfront lawn available for slot booking on December 25th, 2026? We are planning a local community festival.", date: "Today, 11:05 AM" },
                  { name: "Neha Vyas", email: "neha.vyas@yahoo.com", subject: "Refund on cancelled concert", message: "My booking for the Lawn Indie Concert was cancelled but the transaction value hasn't been returned to my UPI ID. Please check.", date: "Yesterday, 04:30 PM" },
                  { name: "Vikram Rathod", email: "vikram.r@outlook.com", subject: "Organizer password reset help", message: "I am unable to receive the email reset link on my host login. Please help verify my account.", date: "3 days ago" }
                ];

                const getRoleBadgeColor = (r) => {
                  switch(r) {
                    case 'organizer': return 'bg-primary-50 text-primary-600 border-primary-100';
                    case 'plot_owner': return 'bg-blue-50 text-blue-600 border-blue-100';
                    default: return 'bg-slate-100 text-slate-600 border-slate-200';
                  }
                };

                return (
                  <div className="space-y-6 text-left">
                    {/* Key Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Total Users</span>
                        <span className="text-2xl font-black text-white">{usersList.length}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Total Events</span>
                        <span className="text-2xl font-black text-white">{events.length}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Total Plots</span>
                        <span className="text-2xl font-black text-white">{venues.length}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Pending Plots</span>
                        <span className="text-2xl font-black text-amber-400">
                          {venues.filter(v => v.approval_status === 'pending').length}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Pending Events</span>
                        <span className="text-2xl font-black text-blue-400">
                          {events.filter(e => e.status === 'pending').length}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-xl flex flex-col justify-between min-h-24">
                        <span className="block text-[#9CA3AF] text-[10px] font-bold uppercase tracking-wider mb-1">Bookings</span>
                        <span className="text-2xl font-black text-white">{bookingRequests.length}</span>
                      </div>
                    </div>

                    {/* 4-Card Overview Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Recent Users */}
                      <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <Users size={16} className="text-blue-400" />
                            Recent Users
                          </h3>
                          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase">Latest registrations</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {recentUsers.map((u, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#141420] border border-white/10 text-xs">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-bold uppercase">{u.name[0]}</div>
                                <div>
                                  <span className="font-bold text-white block">{u.name}</span>
                                  <span className="text-[10px] text-[#9CA3AF] font-semibold">{u.email}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-block text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider bg-purple-500/20 text-purple-300 border-purple-500/30">
                                  {u.role.replace('_', ' ')}
                                </span>
                                <span className="block text-[9px] text-[#9CA3AF] mt-0.5">{u.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Events */}
                      <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={16} className="text-[#7C3AED]" />
                            Recent Events
                          </h3>
                          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase">Newly posted</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {events.slice(0, 4).map((e) => (
                            <div key={e.id} className="flex justify-between items-center p-3 rounded-xl bg-[#141420] border border-white/10 text-xs">
                              <div>
                                <span className="font-bold text-white block">{e.title}</span>
                                <span className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wide">{e.category}</span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                                  e.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}>
                                  {e.status || 'pending'}
                                </span>
                                <span className="block text-[9px] text-[#9CA3AF] mt-0.5">{e.date}</span>
                              </div>
                            </div>
                          ))}
                          {events.length === 0 && (
                            <div className="text-center py-8 text-[#9CA3AF] text-xs italic">No events registered yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Recent Payments */}
                      <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <IndianRupee size={16} className="text-emerald-400" />
                            Recent Payments
                          </h3>
                          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase">Latest transaction log</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {paymentsHistory.slice(0, 4).map((p) => (
                            <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-[#141420] border border-white/10 text-xs">
                              <div>
                                <span className="font-bold text-white block truncate max-w-44">{p.booking_name}</span>
                                <span className="text-[9px] font-mono text-[#9CA3AF]">{p.transaction_id || p.razorpay_order_id}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-black text-emerald-400 block">₹{p.amount}</span>
                                  <span className="text-[9px] text-[#9CA3AF] font-bold">{p.date}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleViewPaymentReceipt(p.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-purple-300 border border-[#7C3AED]/40 text-[9px] font-bold uppercase cursor-pointer transition-colors"
                                >
                                  Receipt
                                </button>
                              </div>
                            </div>
                          ))}
                          {paymentsHistory.length === 0 && (
                            <div className="text-center py-8 text-[#9CA3AF] text-xs italic">No payment transactions recorded.</div>
                          )}
                        </div>
                      </div>

                      {/* Recent Contact Messages */}
                      <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <Mail size={16} className="text-purple-400" />
                            Recent Contact Messages
                          </h3>
                          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase">Latest support queries</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {recentContacts.map((c, i) => (
                            <div key={i} className="p-3 rounded-xl bg-[#141420] border border-white/10 text-xs flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-white block">{c.name}</span>
                                  <span className="text-[10px] text-[#9CA3AF] font-semibold">{c.email}</span>
                                </div>
                                <span className="text-[9px] text-[#9CA3AF] font-bold">{c.date}</span>
                              </div>
                              <div className="bg-[#181825] p-2 rounded-lg border border-white/10 text-[11px] text-slate-300 font-medium leading-relaxed">
                                <strong className="text-white block mb-0.5">{c.subject}</strong>
                                "{c.message}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {adminTab === 'listings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl">
                    <h3 className="font-bold text-white mb-4">All Venues ({venues.length})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {venues.map(v => (
                        <div key={v.id} className="flex flex-col gap-2 p-3 rounded-xl bg-[#141420] border border-white/10 text-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-white block">{v.name}</span>
                              <span className="text-[10px] text-[#9CA3AF]">Owner: {v.owner?.email || 'N/A'}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              v.approval_status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              v.approval_status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {v.approval_status || 'pending'}
                            </span>
                          </div>
                          
                          {v.approval_status === 'pending' && (
                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                onClick={() => handleApproveVenue(v.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setVenueRejectionInputId(v.id);
                                  setVenueRejectionReason('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {venueRejectionInputId === v.id && (
                            <div className="mt-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-left space-y-2">
                              <label className="text-[9px] font-bold text-rose-300 uppercase block">Reason for Rejection</label>
                              <textarea
                                value={venueRejectionReason}
                                onChange={(e) => setVenueRejectionReason(e.target.value)}
                                placeholder="Explain reason (e.g. invalid license)..."
                                rows={2}
                                className="w-full p-2 text-xs rounded-xl bg-[#141420] border border-white/10 text-white outline-none focus:border-rose-400"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleRejectVenue(v.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setVenueRejectionInputId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-[#181825] border border-white/10 text-slate-300 font-bold text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {v.approval_status === 'rejected' && v.rejection_reason && (
                            <div className="text-[10px] text-rose-400 mt-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                              <strong>Rejection Reason:</strong> {v.rejection_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl">
                    <h3 className="font-bold text-white mb-4">All Events ({events.length})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {events.map(e => (
                        <div key={e.id} className="flex justify-between items-center p-3 rounded-xl bg-[#141420] border border-white/10 text-sm">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{e.title}</span>
                            <span className="text-[10px] text-[#9CA3AF] uppercase">{e.status || 'pending'}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 font-semibold">{e.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl md:col-span-2">
                    <h3 className="font-bold text-white mb-4">All Booking Requests ({bookingRequests.length})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bookingRequests.map(req => (
                        <div key={req.id} className="flex justify-between items-center p-3 rounded-xl bg-[#141420] border border-white/10 text-sm">
                          <div>
                            <span className="font-semibold text-white block">{req.venue_details?.name}</span>
                            <span className="text-xs text-[#9CA3AF]">{req.customer?.email} · {req.start_date} to {req.end_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">₹{req.total_price}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              req.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              req.status === 'approved' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              req.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>{req.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'event_approvals' && (
                /* Event Approval Workflow View */
                <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-white text-lg">Event Approval Requests</h3>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search event name..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="pl-9 pr-4 py-2.5 w-full sm:w-48 rounded-xl border border-white/10 bg-[#141420] text-white focus:border-[#7C3AED] outline-none text-xs"
                        />
                      </div>
                      <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-white/10 outline-none text-xs text-white bg-[#141420] cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Table listings */}
                  {(() => {
                    const filteredEvents = events.filter(e => {
                      const matchesSearch = e.title?.toLowerCase().includes(adminSearch.toLowerCase());
                      const matchesStatus = adminStatusFilter === 'all' || e.status === adminStatusFilter;
                      return matchesSearch && matchesStatus;
                    });

                    if (filteredEvents.length === 0) {
                      return (
                        <div className="text-center py-12 text-[#9CA3AF] text-sm">
                          <Info className="mx-auto mb-2 text-slate-500" size={24} />
                          No event requests match the current filters.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">
                              <th className="pb-3">Event Details</th>
                              <th className="pb-3">Organizer</th>
                              <th className="pb-3">Schedule</th>
                              <th className="pb-3">Price / Tix</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                            {filteredEvents.map(e => (
                              <tr key={e.id} className="hover:bg-white/[0.02]">
                                <td className="py-4">
                                  <span className="block font-bold text-white">{e.title}</span>
                                  <span className="text-[10px] text-purple-300 uppercase tracking-wide bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-2 py-0.5 rounded-full inline-block mt-0.5">{e.category}</span>
                                </td>
                                <td className="py-4 text-xs text-slate-300">{e.organizer?.email}</td>
                                <td className="py-4 text-xs text-slate-300">{formatDateDDMMYYYY(e.date)} ({formatTimeAMPM(e.time)})</td>
                                <td className="py-4 text-xs">
                                  {['Concert', 'Social / Garba'].includes(e.category) ? (
                                    <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                                      Category-Based Passes
                                    </span>
                                  ) : (
                                    <>
                                      <span className="block font-black text-white">₹{e.ticket_price}</span>
                                      <span className="text-[#9CA3AF]">{e.total_tickets} passes</span>
                                    </>
                                  )}
                                </td>
                                <td className="py-4">
                                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                    e.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                    e.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  }`}>
                                    {e.status || 'pending'}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <button
                                      onClick={() => setSelectedAdminEvent(e)}
                                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#141420] text-slate-200 hover:text-white hover:border-[#7C3AED] text-xs font-bold cursor-pointer"
                                    >
                                      Review Details
                                    </button>
                                    
                                    {e.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveEvent(e.id)}
                                          disabled={actionLoading}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRejectionInputId(e.id);
                                            setRejectionReason('');
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Inline Rejection Reason TextBox */}
                                  {rejectionInputId === e.id && (
                                    <div className="mt-3 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-left space-y-2 max-w-xs ml-auto">
                                      <label className="text-[10px] font-bold text-rose-300 uppercase block pl-1">Reason for Rejection</label>
                                      <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain reason (e.g. invalid location)..."
                                        rows={2}
                                        className="w-full p-2 text-xs rounded-xl bg-[#141420] border border-white/10 text-white outline-none focus:border-rose-400"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => handleRejectEvent(e.id)}
                                          className="px-2.5 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => setRejectionInputId(null)}
                                          className="px-2.5 py-1.5 rounded-lg bg-[#181825] border border-white/10 text-slate-300 font-bold text-[10px] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {adminTab === 'users' && (
                <div className="p-6 rounded-3xl bg-[#181825] border border-white/10 shadow-xl space-y-6 text-left">
                  <h3 className="font-bold text-white text-lg">User Management</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Customers */}
                    <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col min-h-[300px]">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 mb-3 flex justify-between items-center">
                        <span>Customers</span>
                        <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                          {usersList.filter(u => u.role === 'customer').length}
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-grow">
                        {usersList.filter(u => u.role === 'customer').map(u => (
                          <div key={u.id} className="p-3 bg-[#181825] rounded-xl border border-white/10 shadow-sm text-xs">
                            <span className="block font-bold text-white">{u.first_name || u.email.split('@')[0]}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-semibold">{u.email}</span>
                          </div>
                        ))}
                        {usersList.filter(u => u.role === 'customer').length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-8 italic">No registered customers.</div>
                        )}
                      </div>
                    </div>

                    {/* Plot Owners */}
                    <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col min-h-[300px]">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 mb-3 flex justify-between items-center">
                        <span>Plot Owners</span>
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px]">
                          {usersList.filter(u => u.role === 'plot_owner').length}
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-grow">
                        {usersList.filter(u => u.role === 'plot_owner').map(u => (
                          <div key={u.id} className="p-3 bg-[#181825] rounded-xl border border-white/10 shadow-sm text-xs">
                            <span className="block font-bold text-white">{u.first_name || u.email.split('@')[0]}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-semibold">{u.email}</span>
                          </div>
                        ))}
                        {usersList.filter(u => u.role === 'plot_owner').length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-8 italic">No registered plot owners.</div>
                        )}
                      </div>
                    </div>

                    {/* Organizers */}
                    <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col min-h-[300px]">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 mb-3 flex justify-between items-center">
                        <span>Organizers</span>
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px]">
                          {usersList.filter(u => u.role === 'organizer').length}
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-grow">
                        {usersList.filter(u => u.role === 'organizer').map(u => (
                          <div key={u.id} className="p-3 bg-[#181825] rounded-xl border border-white/10 shadow-sm text-xs">
                            <span className="block font-bold text-white">{u.first_name || u.email.split('@')[0]}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-semibold">{u.email}</span>
                          </div>
                        ))}
                        {usersList.filter(u => u.role === 'organizer').length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-8 italic">No registered organizers.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
      {/* Organizer Ticket Management Console Modal */}
      <AnimatePresence>
        {selectedEventForTickets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <button
                onClick={() => setSelectedEventForTickets(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-white">Ticket Categories Management</h3>
                <p className="text-xs text-[#9CA3AF]">Event: <strong className="text-white">{selectedEventForTickets.title}</strong></p>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                  {modalSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left side: Form (2/5 width) */}
                <form onSubmit={handleSaveTicketType} className="lg:col-span-2 space-y-4 border-r border-white/10 pr-0 lg:pr-6 text-left">
                  <h4 className="font-bold text-white text-sm">
                    {editingTicketTypeId ? 'Edit Ticket Category' : 'Create Ticket Category'}
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Category Name</label>
                    <input
                      type="text"
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="e.g. VIP Pass, Student Pass, Early Bird"
                      className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Description</label>
                    <input
                      type="text"
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="e.g. Access to front row, free food coupon..."
                      className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Total Tickets</label>
                      <input
                        type="number"
                        min="1"
                        value={ticketTotalQty}
                        onChange={(e) => setTicketTotalQty(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Max Tickets/User</label>
                      <input
                        type="number"
                        min="1"
                        value={ticketMaxPerUser}
                        onChange={(e) => setTicketMaxPerUser(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Display Order</label>
                      <input
                        type="number"
                        value={ticketDisplayOrder}
                        onChange={(e) => setTicketDisplayOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Sale Start Date</label>
                      <input
                        type="date"
                        value={ticketSaleStartDate}
                        onChange={(e) => setTicketSaleStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Sale Start Time</label>
                      <input
                        type="time"
                        value={ticketSaleStartTime}
                        onChange={(e) => setTicketSaleStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Sale End Date</label>
                      <input
                        type="date"
                        value={ticketSaleEndDate}
                        onChange={(e) => setTicketSaleEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Sale End Time</label>
                      <input
                        type="time"
                        value={ticketSaleEndTime}
                        onChange={(e) => setTicketSaleEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Benefits (Comma-separated)</label>
                    <input
                      type="text"
                      value={ticketBenefits}
                      onChange={(e) => setTicketBenefits(e.target.value)}
                      placeholder="e.g. VIP Lounge, Free Drinks, Priority Seat"
                      className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Theme Color</label>
                      <select
                        value={ticketColor}
                        onChange={(e) => setTicketColor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs cursor-pointer text-white"
                      >
                        <option value="blue" className="bg-[#141420] text-white">Blue</option>
                        <option value="green" className="bg-[#141420] text-white">Green</option>
                        <option value="red" className="bg-[#141420] text-white">Red</option>
                        <option value="amber" className="bg-[#141420] text-white">Amber</option>
                        <option value="slate" className="bg-[#141420] text-white">Slate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Status</label>
                      <select
                        value={ticketStatus}
                        onChange={(e) => setTicketStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs cursor-pointer text-white"
                      >
                        <option value="active" className="bg-[#141420] text-white">Active</option>
                        <option value="inactive" className="bg-[#141420] text-white">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-grow py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      {actionLoading ? 'Saving...' : editingTicketTypeId ? 'Update Category' : 'Add Category'}
                    </button>
                    {editingTicketTypeId && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketName('');
                          setTicketDesc('');
                          setTicketPrice(0);
                          setTicketTotalQty(100);
                          setTicketMaxPerUser(10);
                          setTicketSaleStartDate('');
                          setTicketSaleStartTime('');
                          setTicketSaleEndDate('');
                          setTicketSaleEndTime('');
                          setTicketBenefits('');
                          setTicketColor('blue');
                          setTicketDisplayOrder(0);
                          setTicketStatus('active');
                          setEditingTicketTypeId(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-[#141420] hover:bg-white/5 text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Right side: Categories list (3/5 width) */}
                <div className="lg:col-span-3 space-y-4 text-left">
                  <h4 className="font-bold text-white text-sm">Active Categories ({eventTicketTypes.length})</h4>
                  
                  {eventTicketTypes.length === 0 ? (
                    <div className="text-center py-16 text-[#9CA3AF] text-xs border border-dashed border-white/10 rounded-3xl">
                      No categories created. Define ticket categories on the left.
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-2">
                      {eventTicketTypes.map(ticket => {
                        const ticketsSold = ticket.total_quantity - ticket.remaining_quantity;
                        const revenue = ticketsSold * parseFloat(ticket.price);

                        const colors = {
                          red: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                          blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                          green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                          slate: 'bg-slate-800 text-slate-300 border-slate-700'
                        }[ticket.color] || 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                        return (
                          <div key={ticket.id} className="p-4 rounded-2xl border border-white/10 bg-[#141420] space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide mb-1 ${colors}`}>
                                  {ticket.name}
                                </span>
                                <p className="text-xs font-semibold text-slate-300">{ticket.description || 'No description provided.'}</p>
                              </div>
                              <span className="text-xs font-black text-white">₹{parseFloat(ticket.price).toLocaleString()}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[10px] text-[#9CA3AF] font-bold border-t border-white/10 pt-2">
                              <div>
                                <span className="block text-[8px] text-[#9CA3AF] uppercase">Sold/Total</span>
                                <span className="text-white">{ticketsSold} / {ticket.total_quantity}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-[#9CA3AF] uppercase">Max/User</span>
                                <span className="text-white">{ticket.max_per_user} tickets</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-[#9CA3AF] uppercase">Revenue</span>
                                <span className="text-emerald-400">₹{revenue.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span className={`text-[8px] font-black uppercase tracking-wider ${ticket.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                Status: {ticket.status}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTicketTypeId(ticket.id);
                                    setTicketName(ticket.name);
                                    setTicketDesc(ticket.description);
                                    setTicketPrice(ticket.price);
                                    setTicketTotalQty(ticket.total_quantity);
                                    setTicketMaxPerUser(ticket.max_per_user);
                                    setTicketSaleStartDate(ticket.sale_start ? ticket.sale_start.substring(0, 10) : '');
                                    setTicketSaleStartTime(ticket.sale_start ? ticket.sale_start.substring(11, 16) : '');
                                    setTicketSaleEndDate(ticket.sale_end ? ticket.sale_end.substring(0, 10) : '');
                                    setTicketSaleEndTime(ticket.sale_end ? ticket.sale_end.substring(11, 16) : '');
                                    setTicketBenefits(ticket.benefits?.join(', ') || '');
                                    setTicketColor(ticket.color);
                                    setTicketDisplayOrder(ticket.display_order);
                                    setTicketStatus(ticket.status);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#181825] border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateTicketType(ticket, selectedEventForTickets.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#181825] border border-white/10 text-blue-400 hover:text-blue-300 text-[10px] font-bold cursor-pointer"
                                >
                                  Duplicate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTicketType(ticket.id, selectedEventForTickets.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Organizer Event Schedule Management Modal */}
      <AnimatePresence>
        {selectedEventForSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181825] border border-white/10 rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <button
                onClick={() => setSelectedEventForSchedule(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>

              <div className="mb-6 text-left">
                <h3 className="text-xl font-black text-white">Manage Event Schedule (Agenda)</h3>
                <p className="text-xs text-[#9CA3AF]">Event: <strong className="text-white">{selectedEventForSchedule.title}</strong></p>
                {selectedEventForSchedule.end_time ? (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Event bounds: {selectedEventForSchedule.time} - {selectedEventForSchedule.end_time}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Starts at {selectedEventForSchedule.time}. Define an event end time when editing the event to bound sessions.
                  </p>
                )}
              </div>

              {scheduleModalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  {scheduleModalError}
                </div>
              )}

              {scheduleModalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                  {scheduleModalSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Form: Add / Edit Session (2/5 width) */}
                <form onSubmit={handleAddOrUpdateSession} className="lg:col-span-2 space-y-4 border-r border-white/10 pr-0 lg:pr-6 text-left">
                  <h4 className="font-bold text-white text-sm">
                    {editingSessionId ? 'Edit Session Item' : 'Add Agenda Session'}
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Session Title</label>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      placeholder="e.g. Registration, Keynote Speech"
                      className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Session Description</label>
                    <textarea
                      value={newSessionDesc}
                      onChange={(e) => setNewSessionDesc(e.target.value)}
                      placeholder="Detail topics discussed, break rules, or notes..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Start Time</label>
                      <input
                        type="time"
                        value={newSessionStart}
                        onChange={(e) => setNewSessionStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">End Time</label>
                      <input
                        type="time"
                        value={newSessionEnd}
                        onChange={(e) => setNewSessionEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Speaker (Optional)</label>
                      <input
                        type="text"
                        value={newSessionSpeaker}
                        onChange={(e) => setNewSessionSpeaker(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase pl-1 block">Room/Hall (Optional)</label>
                      <input
                        type="text"
                        value={newSessionRoom}
                        onChange={(e) => setNewSessionRoom(e.target.value)}
                        placeholder="e.g. Room A-202"
                        className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-grow py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      {editingSessionId ? 'Update Session' : 'Add Session'}
                    </button>
                    {editingSessionId && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewSessionTitle('');
                          setNewSessionDesc('');
                          setNewSessionStart('');
                          setNewSessionEnd('');
                          setNewSessionSpeaker('');
                          setNewSessionRoom('');
                          setEditingSessionId(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-[#141420] hover:bg-white/5 text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Right side: Session List preview (3/5 width) */}
                <div className="lg:col-span-3 space-y-4 text-left">
                  <h4 className="font-bold text-white text-sm">Chronological Agenda Timeline ({eventScheduleList.length})</h4>
                  
                  {eventScheduleList.length === 0 ? (
                    <div className="text-center py-16 text-[#9CA3AF] text-xs border border-dashed border-white/10 rounded-3xl">
                      No agenda items configured. Create sessions on the left to build the timeline.
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-2">
                      <div className="relative border-l-2 border-white/10 ml-4 pl-6 space-y-6">
                        {eventScheduleList.map((session, idx) => (
                          <div key={session.id || idx} className="relative group text-sm">
                            {/* Circle marker */}
                            <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-[#181825] border-2 border-[#7C3AED] flex items-center justify-center shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-[#141420] p-3 rounded-2xl">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[9px] font-black text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-purple-500/30">
                                    <Clock size={8} />
                                    {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                                  </span>
                                  {session.speaker_name && (
                                    <span className="text-[8px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-md border border-blue-500/30">
                                      👤 {session.speaker_name}
                                    </span>
                                  )}
                                  {session.venue_room && (
                                    <span className="text-[8px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                                      📍 {session.venue_room}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-extrabold text-white text-xs">{session.title}</h5>
                                <p className="text-[10px] text-[#9CA3AF] line-clamp-1">{session.description}</p>
                              </div>

                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSessionId(session.id);
                                    setNewSessionTitle(session.title);
                                    setNewSessionDesc(session.description);
                                    setNewSessionStart(session.start_time.substring(0, 5));
                                    setNewSessionEnd(session.end_time.substring(0, 5));
                                    setNewSessionSpeaker(session.speaker_name || '');
                                    setNewSessionRoom(session.venue_room || '');
                                  }}
                                  className="p-1 rounded bg-[#181825] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                                  title="Edit Session"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer"
                                  title="Delete Session"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      </motion.div>
    </div>
  );
};

export default HomePage;
