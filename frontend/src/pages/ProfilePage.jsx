import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { updateUser, setVerified } from '../store/authSlice';
import { motion } from 'framer-motion';
import { User, Mail, ShieldAlert, CheckCircle2, Save, Loader2, Lock } from 'lucide-react';
import api from '../services/api';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerifyNow = async () => {
    setIsVerifying(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/auth/resend-verification/', { auto_verify: true });
      setIsVerified(true);
      setSuccess(res.data.message || 'Email verified successfully!');
      dispatch(setVerified());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    const cleanNewEmail = newEmail.trim().toLowerCase();
    
    if (!cleanNewEmail || !currentPassword) {
      setEmailError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (cleanNewEmail === email.toLowerCase()) {
      setEmailError('New email must be different from current email.');
      return;
    }

    setIsUpdatingEmail(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const response = await api.post('/api/auth/change-email/', {
        new_email: cleanNewEmail,
        current_password: currentPassword,
      });

      setEmail(cleanNewEmail);
      dispatch(updateUser(response.data.user));
      
      setEmailSuccess('Email address updated successfully!');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setEmailError(err.response?.data?.error || 'Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/auth/profile/');
        const data = response.data;
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setRole(data.role || '');
        setIsVerified(data.is_email_verified || false);
      } catch (err) {
        setError('Failed to fetch profile details.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.patch('/api/auth/profile/', {
        first_name: firstName,
        last_name: lastName,
      });

      // Update Redux state
      dispatch(updateUser(response.data));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-[#0B0B12] text-purple-400 border border-purple-500/30';
      case 'organizer':
        return 'bg-[#0B0B12] text-pink-400 border border-pink-500/30';
      case 'plot_owner':
        return 'bg-[#0B0B12] text-cyan-400 border border-cyan-500/30';
      default:
        return 'bg-[#0B0B12] text-slate-300 border border-white/10';
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0B0B12]">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white font-sans py-12 px-4 md:px-8 max-w-4xl mx-auto text-left relative overflow-hidden">
      
      {/* Glow Mesh Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 md:p-12 space-y-8 relative z-10"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-white/10 pb-8">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-purple-500/20 shrink-0">
            {firstName ? firstName[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
              {firstName} {lastName}
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider ${getRoleBadge(role)}`}>
                {role ? role.replace('_', ' ') : 'Customer'}
              </span>
              {isVerified ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 size={13} />
                  Verified Account
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  <ShieldAlert size={13} />
                  Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Warning banner for email verification */}
        {!isVerified && (
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
              onClick={handleVerifyNow}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isVerifying ? (
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

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                value={email}
                disabled
                className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12]/60 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>

        {/* Change Email Address Section */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Change Email Address</h3>
            <p className="text-slate-400 text-xs mt-1">Update your primary registration email address. You will be required to re-authenticate with your password.</p>
          </div>

          {emailError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              {emailSuccess}
            </div>
          )}

          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Current Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12]/60 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">New Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new.email@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingEmail}
              className="w-full sm:w-auto px-8 py-4 bg-[#0B0B12] border border-white/10 hover:border-pink-500/50 hover:bg-white/5 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdatingEmail ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <span>Update Email</span>
              )}
            </button>
          </form>
        </div>

        {/* Security Password Change Section */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Security & Password</h3>
            <p className="text-slate-400 text-xs mt-1">
              Keep your account safe by updating your password regularly.
            </p>
          </div>
          <Link
            to="/change-password"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            <Lock size={15} />
            <span>Change Account Password</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
