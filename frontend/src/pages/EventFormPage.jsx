import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Ticket, Tag, MapPin, Image, Plus, Trash2, ArrowLeft, Loader2, Save, Users } from 'lucide-react';
import api from '../services/api';

const TimePickerAMPM = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  // Convert "HH:MM" (24h) to 12h format { hour12, minute, period }
  const parse24To12 = (time24) => {
    if (!time24) return { hour12: '10', minute: '00', period: 'AM' };
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parts[1].substring(0, 2) : '00';
    if (isNaN(h)) return { hour12: '10', minute: '00', period: 'AM' };
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const strH = h < 10 ? `0${h}` : `${h}`;
    return { hour12: strH, minute: m, period };
  };

  const format12To24 = (h12, m, p) => {
    let h = parseInt(h12, 10);
    if (p === 'PM' && h < 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    const strH = h < 10 ? `0${h}` : `${h}`;
    return `${strH}:${m}:00`;
  };

  const { hour12, minute, period } = parse24To12(value);

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const handleSelectHour = (h) => {
    onChange(format12To24(h, minute, period));
  };

  const handleSelectMinute = (m) => {
    onChange(format12To24(hour12, m, period));
  };

  const handleSelectPeriod = (p) => {
    onChange(format12To24(hour12, minute, p));
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayString = value ? `${hour12}:${minute} ${period}` : 'Select Time (e.g. 10:00 AM)';

  return (
    <div className="relative" ref={containerRef}>
      {/* Input Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 hover:border-[#7C3AED]/50 focus:border-[#7C3AED] text-white text-sm cursor-pointer text-left transition-colors relative"
      >
        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C3AED]" size={18} />
        <span className={value ? "font-semibold text-white" : "text-slate-400"}>
          {displayString}
        </span>
      </button>

      {/* Dark Theme Popover Card */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 p-4 rounded-2xl bg-[#181825] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white w-72 backdrop-blur-xl animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Select Start Time</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#9CA3AF] hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg bg-[#141420] hover:bg-white/10 transition-colors"
            >
              Done ✕
            </button>
          </div>

          {/* AM / PM Selector */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-[#141420] p-1 rounded-xl border border-white/10">
            {['AM', 'PM'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectPeriod(p)}
                className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[#7C3AED] text-white shadow-md'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Hours & Minutes Columns */}
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* Hours Column */}
            <div>
              <span className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-1.5">Hours</span>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {hoursList.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      hour12 === h
                        ? 'bg-[#7C3AED] text-white shadow'
                        : 'bg-[#141420] text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <span className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-1.5">Minutes</span>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {minutesList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      minute === m
                        ? 'bg-[#7C3AED] text-white shadow'
                        : 'bg-[#141420] text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Exhibition'); // Default category
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  
  // Custom 3-Tier Pass States for Concert / Garba
  const [generalPrice, setGeneralPrice] = useState('299');
  const [generalQty, setGeneralQty] = useState('500');
  const [vipPrice, setVipPrice] = useState('799');
  const [vipQty, setVipQty] = useState('200');
  const [deluxePrice, setDeluxePrice] = useState('1499');
  const [deluxeQty, setDeluxeQty] = useState('100');

  const isMultiPassCategory = ['Concert', 'Social / Garba'].includes(category);
  const [images, setImages] = useState([]);
  const [venues, setVenues] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);

  const [isFetching, setIsFetching] = useState(false);
  const [isVenuesLoading, setIsVenuesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const categories = ['Exhibition', 'Concert', 'Festival', 'Conference', 'Social / Garba', 'Wedding', 'Other'];
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => {
    const fetchEligibleVenuesAndEvent = async () => {
      setIsVenuesLoading(true);
      try {
        const uniqueVenues = [];
        const seenIds = new Set();

        // 1. Fetch user venue bookings
        try {
          const response = await api.get('/api/venues/bookings/');
          const bookings = Array.isArray(response.data) ? response.data : response.data.results || [];
          const conf = bookings.filter(b => b && b.status === 'paid');
          setConfirmedBookings(conf);
          
          conf.forEach(b => {
            const vId = b.venue_details?.id || b.venue;
            if (vId && !seenIds.has(vId)) {
              seenIds.add(vId);
              uniqueVenues.push({
                id: vId,
                name: b.venue_details?.name || 'Confirmed Party Plot',
                address: b.venue_details?.address || '',
                start_date: b.start_date ? b.start_date.split('T')[0] : '',
                end_date: b.end_date ? b.end_date.split('T')[0] : ''
              });
            }
          });
        } catch (err) {
          console.warn('Venue bookings fetch skipped or unavailable:', err);
        }

        // 2. Fetch all public venues
        try {
          const allVenuesRes = await api.get('/api/venues/');
          const allVenuesList = Array.isArray(allVenuesRes.data) ? allVenuesRes.data : allVenuesRes.data.results || [];
          allVenuesList.forEach(v => {
            if (v && v.id && !seenIds.has(v.id)) {
              seenIds.add(v.id);
              uniqueVenues.push({
                id: v.id,
                name: v.name,
                address: v.address || '',
                start_date: '',
                end_date: ''
              });
            }
          });
        } catch (err) {
          console.warn('General venues fetch skipped:', err);
        }

        // 3. Fetch event details if in Edit Mode
        if (isEditMode) {
          try {
            const eventResponse = await api.get(`/api/events/${id}/`);
            const data = eventResponse.data;
            setTitle(data.title || '');
            setDescription(data.description || '');
            setCategory(data.category || 'Exhibition');
            setVenueId(data.venue || '');
            setDate(data.date ? data.date.split('T')[0] : '');
            setEndDate(data.end_date ? data.end_date.split('T')[0] : (data.date ? data.date.split('T')[0] : ''));
            setTime(data.time || '');
            setTicketPrice(data.ticket_price || '');
            setTotalTickets(data.total_tickets || '');
            setImages(data.images || []);

            if (data.venue && !seenIds.has(data.venue)) {
              uniqueVenues.push({
                id: data.venue,
                name: data.venue_details?.name || 'Current Event Venue',
                address: data.venue_details?.address || '',
                start_date: data.date ? data.date.split('T')[0] : '',
                end_date: data.date ? data.date.split('T')[0] : ''
              });
            }
          } catch (err) {
            setError('Failed to fetch event details. It might have been deleted.');
          }
        }

        setVenues(uniqueVenues);
      } catch (err) {
        console.error('Failed to load event form data:', err);
      } finally {
        setIsVenuesLoading(false);
      }
    };

    fetchEligibleVenuesAndEvent();
  }, [id, isEditMode]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/venues/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([...images, response.data.url]);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload event image.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalTicketPrice = parseFloat(ticketPrice);
    let finalTotalTickets = parseInt(totalTickets);
    let passCategoriesPayload = null;

    if (isMultiPassCategory) {
      const gPrice = parseFloat(generalPrice || 0);
      const gQty = parseInt(generalQty || 0);
      const vPrice = parseFloat(vipPrice || 0);
      const vQty = parseInt(vipQty || 0);
      const dPrice = parseFloat(deluxePrice || 0);
      const dQty = parseInt(deluxeQty || 0);

      if (gPrice <= 0 || gQty <= 0 || vPrice <= 0 || vQty <= 0 || dPrice <= 0 || dQty <= 0) {
        setError('Please provide valid prices and pass quantities for General, VIP, and Deluxe passes.');
        return;
      }

      finalTicketPrice = gPrice;
      finalTotalTickets = gQty + vQty + dQty;

      passCategoriesPayload = [
        {
          name: "General Pass",
          description: "Standard entry pass for festival ground & general zone access.",
          price: gPrice,
          total_quantity: gQty,
          benefits: ["Main Ground Access", "General Parking Zone", "Food Court Access"],
          color: "green"
        },
        {
          name: "VIP Pass",
          description: "Fast-track VIP entry with prime viewing area near the orchestra stage.",
          price: vPrice,
          total_quantity: vQty,
          benefits: ["Fast-Track VIP Entry Gate", "Prime Orchestra Zone Access", "Dedicated VIP Parking Pass"],
          color: "amber"
        },
        {
          name: "Deluxe Pass",
          description: "Premium luxury pass including stage-side lounge, food vouchers, and artiste photo-op zone.",
          price: dPrice,
          total_quantity: dQty,
          benefits: ["Stage-Side Reserved Lounge", "Complimentary Food Voucher", "Artiste Photo-Op Zone", "Valet Parking Included"],
          color: "purple"
        }
      ];
    } else {
      if (!ticketPrice || !totalTickets) {
        setError('Please fill in all required fields.');
        return;
      }
    }

    if (
      title.trim() === '' ||
      description.trim() === '' ||
      date === '' ||
      time === ''
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    setError('');

    const todayString = new Date().toISOString().split('T')[0];
    if (date < todayString) {
      setError('Event start date cannot be in the past. Please select today or a future date.');
      setIsSaving(false);
      return;
    }
    if (endDate && endDate < date) {
      setError('Event end date cannot be before the start date.');
      setIsSaving(false);
      return;
    }

    if (venueId && confirmedBookings.length > 0) {
      const selectedVenueId = parseInt(venueId);
      const matchingBookings = confirmedBookings.filter(b => (b.venue_details?.id === selectedVenueId || b.venue === selectedVenueId));
      if (matchingBookings.length > 0) {
        const eventStartDate = date.split('T')[0];
        const eventEndDate = (endDate || date).split('T')[0];

        const isValidDate = matchingBookings.some(b => {
          const bStart = b.start_date ? b.start_date.split('T')[0] : '';
          const bEnd = b.end_date ? b.end_date.split('T')[0] : '';
          return (eventStartDate >= bStart && eventEndDate <= bEnd);
        });

        if (!isEditMode && !isValidDate) {
          const validRanges = matchingBookings.map(b => `${b.start_date ? b.start_date.split('T')[0] : ''} to ${b.end_date ? b.end_date.split('T')[0] : ''}`).join(', ');
          setError(`Event date (${eventStartDate}) must fall within your confirmed venue booking dates: ${validRanges}.`);
          setIsSaving(false);
          return;
        }
      }
    }

    const payload = {
      title,
      description,
      category,
      venue: venueId ? parseInt(venueId) : null,
      date,
      end_date: endDate || date,
      time,
      ticket_price: finalTicketPrice,
      total_tickets: finalTotalTickets,
      images,
      ...(passCategoriesPayload ? { pass_categories: passCategoriesPayload } : {})
    };

    try {
      if (isEditMode) {
        await api.put(`/api/events/${id}/`, payload);
      } else {
        await api.post('/api/events/', payload);
      }
      navigate('/home');
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        const firstErrKey = Object.keys(errData)[0];
        setError(`${firstErrKey.replace('_', ' ')}: ${errData[firstErrKey]}`);
      } else {
        setError('Failed to save event. Please check values.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEstimateRevenue = async () => {
    if (!ticketPrice || !totalTickets || !category) {
      setPredictionError('Please provide ticket price, total tickets, and category before estimating.');
      return;
    }
    setPredictionLoading(true);
    setPredictionError('');
    try {
      const payload = {
        ticket_price: parseFloat(ticketPrice),
        total_tickets: parseInt(totalTickets),
        category: category,
        venue_id: venueId ? parseInt(venueId) : null,
      };
      const resp = await api.post('/api/analytics/predict-revenue/', payload);
      setPredictionResult(resp.data);
    } catch (err) {
      setPredictionError(err.response?.data?.error || 'Failed to get prediction.');
    } finally {
      setPredictionLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 py-12 px-4 md:px-8 text-left">
      <div className="max-w-4xl mx-auto">
        <Link to="/home" className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-purple-400 mb-6 group transition-colors">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-[#151522]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <h1 className="text-3xl font-display font-bold text-white mb-6 tracking-wide">
            {isEditMode ? 'Edit Hosted Event' : 'Create Event'}
          </h1>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-bold text-center flex items-center justify-center gap-2 shadow-lg">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navratri Garba Utsav 2026"
                className="w-full px-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Description *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the schedules, entry terms, star lineup, age limit..."
                className="w-full px-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm resize-none"
                required
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Category *</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white outline-none text-sm cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#141420] text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue location linking (optional) */}
            <div className="space-y-1">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Host Venue Plot (Optional)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white outline-none text-sm cursor-pointer appearance-none"
                >
                  <option value="" className="bg-[#141420] text-white">
                    {isVenuesLoading ? '-- Loading available plots... --' : '-- Select a registered plot (Optional) --'}
                  </option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#141420] text-white">
                      {v.name} {v.start_date ? `(Confirmed Booking: ${v.start_date} to ${v.end_date})` : v.address ? `(${v.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Start & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Start Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    min={date || new Date().toISOString().split('T')[0]}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Same as start date if 1 day"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            {/* Event Time */}
            <div className="space-y-1">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Event Start Time *</label>
              <TimePickerAMPM value={time} onChange={(val) => setTime(val)} />
            </div>

            {/* Ticket Prices & Pass Categories */}
            {isMultiPassCategory ? (
              <div className="space-y-4 p-4 rounded-2xl bg-[#141420] border border-white/10 text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket size={16} className="text-[#7C3AED]" />
                    {category} Pass Categories Breakdown
                  </h4>
                  <span className="text-[10px] font-bold bg-[#7C3AED]/20 text-purple-300 px-2 py-0.5 rounded-full border border-[#7C3AED]/30 uppercase">
                    3 Tiers Enabled
                  </span>
                </div>
                
                <p className="text-[11px] text-[#9CA3AF] leading-normal">
                  Specify custom prices and available quantities for each pass tier for your {category} event:
                </p>

                <div className="space-y-3 text-xs">
                  {/* General Pass */}
                  <div className="p-3 rounded-xl bg-[#181825] border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-300 text-xs flex items-center gap-1">
                        🟢 General Pass
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] font-semibold">Standard Entry & Food Stalls</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Price (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="299"
                          value={generalPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseFloat(val) >= 0) setGeneralPrice(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-emerald-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Pass Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="500"
                          value={generalQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) >= 0) setGeneralQty(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-emerald-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* VIP Pass */}
                  <div className="p-3 rounded-xl bg-[#181825] border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1">
                        🟡 VIP Pass / Premium Pass
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] font-semibold">Fast-Track Entry & Prime Orchestra Zone</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Price (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="799"
                          value={vipPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseFloat(val) >= 0) setVipPrice(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Pass Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="200"
                          value={vipQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) >= 0) setVipQty(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-amber-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deluxe Pass */}
                  <div className="p-3 rounded-xl bg-[#181825] border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-300 text-xs flex items-center gap-1">
                        🟣 Deluxe Pass
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] font-semibold">Stage Lounge, Snacks & Photo-Op</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Price (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="1499"
                          value={deluxePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseFloat(val) >= 0) setDeluxePrice(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-purple-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[#9CA3AF] uppercase">Pass Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="100"
                          value={deluxeQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) >= 0) setDeluxeQty(val);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-white outline-none text-xs font-semibold focus:border-purple-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Ticket Price */}
                <div className="space-y-1">
                  <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Ticket Price (INR) *</label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      value={ticketPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) setTicketPrice(val);
                      }}
                      placeholder="e.g. 299 (set 0 for free)"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Total Tickets Capacity */}
                <div className="space-y-1">
                  <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Total Available Tickets *</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      value={totalTickets}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) >= 0) setTotalTickets(val);
                      }}
                      placeholder="e.g. 500"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          {/* Revenue Prediction Section */}
          <div className="space-y-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={handleEstimateRevenue}
              disabled={predictionLoading}
              className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-md shadow-[#7C3AED]/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {predictionLoading ? 'Estimating...' : 'Estimate Revenue'}
            </button>
            {predictionError && (
              <div className="text-xs text-rose-400 font-semibold mt-2">{predictionError}</div>
            )}
            {predictionResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#141420] border border-white/10 text-white text-sm">
                <p className="font-medium">Estimated Revenue: ₹{Number(predictionResult.predicted_revenue).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                {predictionResult.is_estimate && <p className="text-xs text-[#9CA3AF] italic">(This is an estimate)</p>}
                {predictionResult.metrics && (
                  <div className="mt-2 text-xs text-[#9CA3AF]">
                    <p>R²: {predictionResult.metrics.r2_score.toFixed(3)}</p>
                    <p>MAE: ₹{predictionResult.metrics.mae.toFixed(2)}</p>
                    <p>MSE: ₹{predictionResult.metrics.mse.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Upload poster */}
          <div className="space-y-3 border-t border-white/10 pt-6">
            <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1 block">Event Poster / Cover Image</label>
            
            {uploadError && (
              <div className="text-xs text-rose-400 font-semibold">{uploadError}</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative h-28 rounded-2xl overflow-hidden border border-white/10 shadow-sm group">
                  <img src={imgUrl} alt="Event Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-rose-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Upload poster card */}
              <label className="h-28 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#7C3AED] flex flex-col items-center justify-center cursor-pointer transition-colors relative bg-[#141420] text-white">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="animate-spin text-[#7C3AED]" size={24} />
                ) : (
                  <>
                    <Plus className="text-[#9CA3AF]" size={24} />
                    <span className="text-[10px] text-[#9CA3AF] font-bold uppercase mt-1">Upload Poster</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold shadow-lg shadow-[#7C3AED]/20 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Save Changes' : 'Create Event'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
      </div>
    </div>
  );
};

export default EventFormPage;
