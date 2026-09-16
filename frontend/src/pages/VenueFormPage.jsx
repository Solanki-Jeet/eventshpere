import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, IndianRupee, Image, Plus, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';
import api from '../services/api';

const VenueFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [images, setImages] = useState([]);
  
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const facilityOptions = [
    'AC Banquet Hall', 'Lawn Garden', 'Valet Parking', 
    'In-house Catering', 'Dressing Rooms', 'Power Backup', 
    'CCTV Security', 'Swimming Pool', 'Stage Decoration'
  ];

  useEffect(() => {
    if (isEditMode) {
      const fetchVenue = async () => {
        setIsFetching(true);
        try {
          const response = await api.get(`/api/venues/${id}/`);
          const data = response.data;
          setName(data.name);
          setDescription(data.description);
          setAddress(data.address);
          setCapacity(data.capacity);
          setPricePerDay(data.price_per_day);
          setSelectedFacilities(data.facilities || []);
          setImages(data.images || []);
        } catch (err) {
          setError('Failed to fetch venue details. It might have been deleted.');
        } finally {
          setIsFetching(false);
        }
      };
      fetchVenue();
    }
  }, [id, isEditMode]);

  const handleFacilityChange = (facility) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call to image upload endpoint
      const response = await api.post('/api/venues/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([...images, response.data.url]);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      name.trim() === '' ||
      description.trim() === '' ||
      address.trim() === '' ||
      capacity === '' ||
      pricePerDay === ''
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    setError('');

    const payload = {
      name,
      description,
      address,
      capacity: parseInt(capacity),
      price_per_day: parseFloat(pricePerDay),
      facilities: selectedFacilities,
      images,
    };

    try {
      if (isEditMode) {
        await api.put(`/api/venues/${id}/`, payload);
      } else {
        await api.post('/api/venues/', payload);
      }
      navigate('/home');
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        const firstErrKey = Object.keys(errData)[0];
        setError(`${firstErrKey.replace('_', ' ')}: ${errData[firstErrKey]}`);
      } else {
        setError('Failed to save venue. Please verify values and try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
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
            {isEditMode ? 'Edit Party Plot' : 'Register Party Plot'}
          </h1>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-bold text-center flex items-center justify-center gap-2 shadow-lg">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Title / Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Plot Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Heritage Garden"
                className="w-full px-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Description / Guidelines *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your plot, capacity divisions, timing, and rules..."
                className="w-full px-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm resize-none"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sindhu Bhavan Road, Bodakdev"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-1">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Guest Capacity *</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) setCapacity(val);
                  }}
                  placeholder="e.g. 1200"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Rate Per Day */}
            <div className="space-y-1">
              <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1">Price Per Day *</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  value={pricePerDay}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) setPricePerDay(val);
                  }}
                  placeholder="e.g. 65000"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141420] border border-white/10 focus:border-[#7C3AED] text-white placeholder-slate-400 transition-all outline-none text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Facilities Checkboxes */}
          <div className="space-y-2 border-t border-white/10 pt-6">
            <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1 block">Facilities & Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilityOptions.map((facility) => (
                <label
                  key={facility}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition-all ${
                    selectedFacilities.includes(facility)
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-purple-300'
                      : 'bg-[#141420] border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(facility)}
                    onChange={() => handleFacilityChange(facility)}
                    className="hidden"
                  />
                  {facility}
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload list */}
          <div className="space-y-3 border-t border-white/10 pt-6">
            <label className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider pl-1 block">Venue Images</label>
            
            {uploadError && (
              <div className="text-xs text-rose-400 font-semibold">{uploadError}</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative h-28 rounded-2xl overflow-hidden border border-white/10 shadow-sm group">
                  <img src={imgUrl} alt="Venue Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Upload Card */}
              <label className="h-28 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#7C3AED] flex flex-col items-center justify-center cursor-pointer transition-colors relative bg-[#141420]">
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
                    <Plus className="text-slate-400" size={24} />
                    <span className="text-[10px] text-[#9CA3AF] font-bold uppercase mt-1">Upload Photo</span>
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
                  <span>{isEditMode ? 'Save Changes' : 'Register Venue'}</span>
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

export default VenueFormPage;
