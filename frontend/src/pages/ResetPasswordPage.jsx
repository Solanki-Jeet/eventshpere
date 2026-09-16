import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [identifier, setIdentifier] = useState(searchParams.get('account') || searchParams.get('email') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength checklist rules
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

    if (!identifier.trim()) {
      setError('Please enter your registered email or username.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all strength requirements.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/reset-password/', {
        identifier: identifier.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully. Please login with your new password.' } });
      }, 2500);

    } catch (err) {
      if (err.response?.status === 404) {
        setError('Account not found.');
      } else {
        setError(
          err.response?.data?.confirm_password?.[0] ||
          err.response?.data?.password?.[0] ||
          err.response?.data?.error ||
          'Failed to reset password. Account not found or invalid request.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background glow mesh */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl glass-card bg-[#151522]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 text-left backdrop-blur-2xl"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-purple-400 mb-6 group transition-colors">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </Link>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="reset-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Lock size={12} /> Direct Password Reset
                </div>
                <h2 className="text-3xl font-display font-extrabold text-white">Reset Account Password</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Enter your registered account identifier and set your new password.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} className="shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Registered Email or Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com or username"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                      required
                    />
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
                      placeholder="••••••••"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
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
                  className="w-full py-4 btn-gradient rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white" size={16} />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="reset-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Password Reset Successfully</h3>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto font-semibold">
                Password reset successfully. Please login with your new password.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="btn-gradient px-8 py-3.5 text-xs font-bold uppercase tracking-wider inline-block rounded-xl"
                >
                  Return to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
