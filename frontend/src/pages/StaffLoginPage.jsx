import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Shield, ArrowRight, Sparkles } from 'lucide-react';

const StaffLoginPage = () => {
  const portals = [
    {
      title: 'Party Plot Owner',
      description: 'List luxury party plots, set daily rental rates, and approve customer date requests.',
      icon: MapPin,
      path: '/login/plotowner',
      color: 'badge-emerald',
    },
    {
      title: 'Event Organizer',
      description: 'Host local events, create VIP ticket passes, manage session agenda, and track sales.',
      icon: Calendar,
      path: '/login/organizer',
      color: 'badge-pink',
    },
    {
      title: 'Executive Admin',
      description: 'Access system analytics, review verification requests, and moderate platform listings.',
      icon: Shield,
      path: '/login/admin',
      color: 'badge-purple',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B12] flex flex-col items-center justify-center px-4 py-16 font-sans relative overflow-hidden text-left">
      
      {/* Background glow mesh */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl text-center space-y-12 relative z-10">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300">
            <Shield size={14} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Management Workspaces</span>
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-extrabold text-white"
          >
            EventSphere <span className="text-gradient">Staff Portals</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto"
          >
            Select your professional role below to access your dedicated management portal.
          </motion.p>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {portals.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-card p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="p-3.5 w-fit rounded-2xl bg-purple-500/20 text-purple-400">
                    <Icon size={22} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-pink-400 transition-colors">
                      {portal.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10">
                  <Link
                    to={portal.path}
                    className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-purple-400 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Go to Portal</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Navigation link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-4 text-xs text-slate-400"
        >
          Are you a guest looking for event passes?{' '}
          <Link to="/login" className="text-pink-400 hover:underline font-bold">
            Sign In as Customer
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default StaffLoginPage;
