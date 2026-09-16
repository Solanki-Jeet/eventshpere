import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const LoginPage = ({ roleOverride = 'customer' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const roleSession = useSelector((state) => state.auth[roleOverride]);
  const isRoleAuthenticated = roleSession?.isAuthenticated;
  const roleUser = roleSession?.user;

  React.useEffect(() => {
    if (isRoleAuthenticated && roleUser) {
      const rolePath = roleOverride === 'plot_owner' ? '/plotowner' : `/${roleOverride}`;
      navigate(rolePath);
    }
  }, [isRoleAuthenticated, roleUser, roleOverride, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login/', {
        email: cleanEmail,
        password,
      });

      const credentials = response.data;
      const loggedInRole = credentials.user.role;

      if (loggedInRole !== roleOverride) {
        const roleLabel = roleOverride === 'plot_owner' ? 'Plot Owner' : roleOverride.charAt(0).toUpperCase() + roleOverride.slice(1);
        setError(`This account is not authorized for the ${roleLabel} portal. Please use the correct portal.`);
        setIsLoading(false);
        return;
      }

      dispatch(setCredentials(credentials));
      const rolePath = credentials.user.role === 'plot_owner' ? '/plotowner' : `/${credentials.user.role}`;
      navigate(rolePath);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        err.response?.data?.error || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPortalInfo = () => {
    switch (roleOverride) {
      case 'plot_owner':
        return {
          title: 'Party Plot Owner Portal',
          subtitle: 'Sign in to manage venue availability and booking requests'
        };
      case 'organizer':
        return {
          title: 'Event Organizer Portal',
          subtitle: 'Sign in to publish events and manage ticket sales'
        };
      case 'admin':
        return {
          title: 'Executive Admin Portal',
          subtitle: 'Sign in for system moderation and analytics'
        };
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Sign in to your EventSphere account'
        };
    }
  };

  const { title, subtitle } = getPortalInfo();

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center py-12 px-4 md:px-8 font-sans relative overflow-hidden">
      
      {/* Glow Mesh Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative z-10">
        
        {/* Left Ambient Panel */}
        <div className="lg:col-span-5 bg-gradient-to-b from-purple-950/80 via-[#0B0B12] to-pink-950/80 p-10 text-white flex flex-col justify-center text-left relative overflow-hidden border-r border-white/10">
          <div className="space-y-6 z-10">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="EventSphere Logo" 
                className="h-9 w-auto object-contain" 
              />
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Event<span className="text-purple-400">Sphere</span>
              </span>
            </div>
            <h3 className="font-display text-3xl md:text-4xl text-white font-extrabold leading-tight">
              Curated Events & Luxury Party Plots
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Gujarat's premier platform for concert passes, garba nights, and verified plot rentals.
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 p-8 md:p-12 space-y-8 text-left bg-[#151522]"
        >
          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0B0B12] p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
            <Link
              to="/login"
              className={`flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                roleOverride === 'customer'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Guest
            </Link>
            <Link
              to="/login/organizer"
              className={`flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                roleOverride === 'organizer'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Organizer
            </Link>
            <Link
              to="/login/plotowner"
              className={`flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                roleOverride === 'plot_owner'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plot Owner
            </Link>
            <Link
              to="/login/admin"
              className={`flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                roleOverride === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </Link>
          </div>

          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">{title}</h2>
            <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password" className="text-xs text-pink-400 hover:underline font-semibold">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3.5 bg-[#0B0B12] border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 btn-gradient rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-pink-400 hover:underline font-bold">
              Create Account
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default LoginPage;
