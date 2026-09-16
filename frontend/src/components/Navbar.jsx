import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User as UserIcon, Calendar, Info, Mail, Heart, Bell, TrendingUp, Settings, ChevronDown, HelpCircle, Compass } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.profile-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setIsOpen(false);
  };

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const getDashboardPath = () => {
    if (!user) return '/home';
    return user.role === 'plot_owner' ? '/plotowner' : `/${user.role}`;
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Explore Events', path: '/explore', icon: Compass },
        { name: 'FAQ', path: '/faqs', icon: HelpCircle },
        { name: 'About', path: '/about', icon: Info },
        { name: 'Contact', path: '/contact', icon: Mail },
      ];
    }
    if (user && (user.role === 'plot_owner' || user.role === 'organizer' || user.role === 'admin')) {
      return [
        { name: 'Dashboard', path: getDashboardPath(), icon: TrendingUp },
      ];
    }
    if (user && user.role === 'customer') {
      return [
        { name: 'Explore Events', path: '/explore', icon: Compass },
        { name: 'FAQ', path: '/faqs', icon: HelpCircle },
        { name: 'About', path: '/about', icon: Info },
        { name: 'Contact', path: '/contact', icon: Mail },
      ];
    }
    return [
      { name: 'Dashboard', path: getDashboardPath(), icon: TrendingUp },
    ];
  };

  const getDropdownItems = () => {
    if (!isAuthenticated || !user) return [];
    if (user.role === 'customer') {
      return [
        { name: 'My Bookings', path: '/customer?tab=bookings', icon: Calendar },
        { name: 'Wishlist', path: '/wishlist', icon: Heart },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Profile', path: '/profile', icon: UserIcon },
        { name: 'Settings', path: '/customer?tab=settings', icon: Settings },
      ];
    }
    if (user.role === 'organizer') {
      return [
        { name: 'Analytics', path: '/organizer/analytics', icon: TrendingUp },
        { name: 'Create Event', path: '/events/create', icon: Calendar },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Profile', path: '/profile', icon: UserIcon },
      ];
    }
    if (user.role === 'plot_owner') {
      return [
        { name: 'Create Party Plot', path: '/venues/create', icon: Calendar },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Profile', path: '/profile', icon: UserIcon },
      ];
    }
    if (user.role === 'admin') {
      return [
        { name: 'Analytics Dashboard', path: '/admin/analytics', icon: TrendingUp },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Profile', path: '/profile', icon: UserIcon },
      ];
    }
    return [
      { name: 'Profile', path: '/profile', icon: UserIcon },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ];
  };

  const navLinks = getNavLinks();
  const dropdownItems = getDropdownItems();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-purple';
      case 'organizer':
        return 'badge-pink';
      case 'plot_owner':
        return 'badge-emerald';
      default:
        return 'badge-amber';
    }
  };

  return (
    <nav className={`sticky top-0 z-50 w-full px-4 md:px-8 transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#0B0B12]/85 backdrop-blur-xl border-b border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
        : 'bg-[#0B0B12] border-b border-white/5 py-4'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to={isAuthenticated ? '/home' : '/'} className="flex items-center gap-3 group">
          <img 
            src="/logo.png" 
            alt="EventSphere Logo" 
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
          />
          <div className="flex flex-col text-left">
            <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Event<span className="text-purple-400">Sphere</span>
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#B8B8C5] font-semibold -mt-1">
              Luxury Events & Plots
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1.5 bg-[#181824] backdrop-blur-md p-1.5 rounded-xl border border-white/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    active
                      ? 'bg-[#7C3AED] text-white shadow-md'
                      : 'text-[#B8B8C5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-white' : 'text-[#B8B8C5]'} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 px-4 py-2 border border-white/10 rounded-xl bg-[#181824] hover:border-[#7C3AED]/50 hover:bg-[#222234] transition-all duration-300 cursor-pointer select-none text-left"
                >
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                  <span className="text-white text-sm font-semibold hidden lg:inline max-w-[120px] truncate">
                    {user?.first_name || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`text-[#B8B8C5] transition-transform duration-300 ${showDropdown ? 'rotate-180 text-[#7C3AED]' : ''}`} size={15} />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-60 bg-[#181824] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] py-2 z-50 text-left backdrop-blur-2xl"
                    >
                      <div className="px-4 py-3 border-b border-white/10 bg-[#0B0B12] rounded-t-2xl">
                        <p className="text-sm font-bold text-white truncate">
                          {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'My Account'}
                        </p>
                        <p className="text-xs text-[#B8B8C5] truncate mt-0.5">{user?.email}</p>
                      </div>
                      
                      <div className="py-2">
                        {dropdownItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#B8B8C5] hover:text-white hover:bg-white/5 transition-colors font-semibold"
                            >
                              <Icon size={15} className="text-[#7C3AED]" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="border-t border-white/10 my-1" />

                      <div className="px-2 py-1">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-[#B8B8C5] hover:text-white text-sm font-semibold uppercase tracking-wider px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm font-semibold px-6 py-2.5 shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden w-full overflow-hidden border-t border-white/10 mt-3"
          >
            <div className="flex flex-col gap-2 py-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive(link.path)
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {link.name}
                  </Link>
                );
              })}

              {isAuthenticated && dropdownItems.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'text-pink-400 font-semibold bg-pink-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {link.name}
                  </Link>
                );
              })}

              <div className="h-px bg-white/10 my-2 mx-4" />

              <div className="px-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">
                        Account: <strong className="text-white">{user?.first_name || user?.email}</strong>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getRoleBadgeColor(user?.role)}`}>
                        {user?.role?.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center py-3 rounded-xl border border-white/15 text-white font-semibold text-sm transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center py-3 rounded-xl btn-gradient text-white font-semibold text-sm transition-all"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
