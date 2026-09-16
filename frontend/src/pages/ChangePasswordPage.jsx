import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, ArrowLeft, Check, X } from 'lucide-react';
import api from '../services/api';
import { logout } from '../store/authSlice';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation check
  const rules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as the current password.');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet all security strength requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(response.data.message || 'Password updated successfully.');
      
      // Clear form inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Log user out after 2.5 seconds to require login with new password
      setTimeout(() => {
        dispatch(logout());
        navigate('/login', { state: { message: 'Password changed successfully. Please log in with your new password.' } });
      }, 2500);

    } catch (err) {
      const errRes = err.response?.data;
      const detailError = 
        errRes?.current_password?.[0] ||
        errRes?.new_password?.[0] ||
        errRes?.confirm_password?.[0] ||
        errRes?.password?.[0] ||
        errRes?.error ||
        'Failed to update password. Please check your current password and try again.';
      setError(detailError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Glow Mesh Background */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl bg-[#151522]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 text-left backdrop-blur-2xl"
      >
        <Link to="/profile" className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-pink-400 mb-6 group transition-colors">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Profile</span>
        </Link>

        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={12} /> Account Security
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white">Change Password</h2>
            <p className="text-slate-400 text-xs mt-1">
              Update your account password below. You will be asked to log in again after updating.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength Checklist */}
            <div className="p-4 rounded-2xl bg-[#0B0B12] border border-white/10 space-y-2 text-[11px]">
              <span className="font-bold text-slate-300 uppercase tracking-wider block mb-1">Password Requirements:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${rules.minLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {rules.minLength ? <Check size={13} /> : <X size={13} />}
                  <span>Min 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {rules.hasUpper ? <Check size={13} /> : <X size={13} />}
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasLower ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {rules.hasLower ? <Check size={13} /> : <X size={13} />}
                  <span>1 Lowercase (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {rules.hasNumber ? <Check size={13} /> : <X size={13} />}
                  <span>1 Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 col-span-2 ${rules.hasSpecial ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {rules.hasSpecial ? <Check size={13} /> : <X size={13} />}
                  <span>1 Special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-white" size={16} />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;
