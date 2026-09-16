import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Calendar, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('customer');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !passwordConfirm || !firstName || !lastName) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('Password does not meet all security requirements.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/auth/register/', {
        email: cleanEmail,
        password,
        password_confirm: passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        role,
      });

      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        if (typeof errData.detail === 'string') {
          setError(errData.detail);
        } else if (typeof errData.error === 'string') {
          setError(errData.error);
        } else {
          const fieldErrors = Object.entries(errData)
            .map(([field, msgs]) => {
              const msg = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              const formattedField = field.replace('_', ' ');
              return `${formattedField}: ${msg}`;
            })
            .join(' | ');
          setError(fieldErrors || 'Registration failed. Please check your details.');
        }
      } else {
        setError('Registration failed. Please check details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'customer',
      title: 'Customer / Guest',
      desc: 'Browse & book tickets for concerts & party plots'
    },
    {
      id: 'organizer',
      title: 'Event Organizer',
      desc: 'Host events & sell ticket passes online'
    },
    {
      id: 'plot_owner',
      title: 'Party Plot Owner',
      desc: 'List party plots, lawns, & venue spaces'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center py-12 px-4 md:px-8 font-sans relative overflow-hidden">
      
      {/* Background glow mesh */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl w-full rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 p-8 md:p-12 text-left">
        
        {!success ? (
          <div className="space-y-8">
            <div className="text-left space-y-2 border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={13} /> Create Account
              </div>
              <h1 className="font-display text-3xl font-extrabold text-white">Join EventSphere Gateway</h1>
              <p className="text-slate-400 text-xs">Select your role and enter your details to get started.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Account Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        role === r.id
                          ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-pink-500/50 shadow-lg'
                          : 'bg-[#0B0B12] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <h4 className="font-display font-bold text-white text-xs">{r.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                    className="w-full px-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                    className="w-full px-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 btn-gradient rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-pink-400 hover:underline font-bold">
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Registration Successful!</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your account has been created. Please sign in to access your portal.
            </p>
            <Link
              to="/login"
              className="btn-gradient px-8 py-3.5 text-xs font-bold uppercase tracking-wider inline-block"
            >
              Go to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisterPage;
