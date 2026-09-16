import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Ticket, MapPin, Handshake, ShieldCheck,
  Target, Eye, CheckCircle2, Award, Users, Sparkles, ArrowRight
} from 'lucide-react';
import CountUp from '../components/CountUp';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans space-y-24 py-16 px-4 md:px-8 max-w-7xl mx-auto relative overflow-hidden">

      {/* Background glow meshes */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HERO SECTION WITH DIAGONAL SPLIT TYPOGRAPHY */}
      <section className="relative z-10 border-b border-white/10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300">
              <Award size={14} />
              <span className="text-[11px] font-bold uppercase tracking-widest">About EventSphere</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-[1.12]">
              Elevating Celebrations & <br />
              <span className="text-gradient">Luxury Venues</span> Across Gujarat.
            </h1>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
              EventSphere is Gujarat's premier event discovery and party plot booking gateway. We bridge enthusiastic customers, elite event organizers, and luxury party plot hosts through a unified, high-technology ecosystem.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/explore"
                className="btn-gradient px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
              >
                <span>Explore Events & Plots</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact"
                className="btn-glass px-8 py-4 text-xs font-semibold uppercase tracking-wider"
              >
                Contact Concierge
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl p-2 bg-gradient-to-b from-purple-500/30 to-pink-500/20 border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="overflow-hidden rounded-2xl aspect-[4/3] relative">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&fit=crop"
                  alt="Events in Ahmedabad"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B12] via-transparent to-transparent flex items-end p-6">
                  <div className="text-left text-white">
                    <span className="badge-pink text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Premier Gateway</span>
                    <p className="font-display text-lg font-bold mt-1">Sabarmati Riverfront Lawn Experience</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. VISION & MISSION GLASS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-b border-white/10 pb-16">
        <div className="glass-card p-8 rounded-3xl space-y-4">
          <div className="p-3.5 w-fit rounded-2xl bg-purple-500/20 text-purple-400">
            <Eye size={24} />
          </div>
          <h3 className="font-display text-2xl font-bold text-white">Our Vision</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Make event discovery and luxury venue booking simple, reliable, and accessible across Gujarat. We highlight cultural events, indie concerts, and grand party plots by providing an intuitive digital gateway for seamless gate entry.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl space-y-4">
          <div className="p-3.5 w-fit rounded-2xl bg-pink-500/20 text-pink-400">
            <Target size={24} />
          </div>
          <h3 className="font-display text-2xl font-bold text-white">Our Mission</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect customers, organizers, and party plot owners through one transparent platform. We help organizers market events, enable plot owners to showcase spaces, and ensure guests enjoy unforgettable memories.
          </p>
        </div>
      </section>

      {/* 3. CORE PLATFORM ARCHITECTURE */}
      <section className="space-y-12 border-b border-white/10 pb-16 text-left">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Core Ecosystem</span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white mt-1">Four Pillars of EventSphere</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Calendar, title: '1. Discover Events', desc: 'Find concerts, festivals, garba nights, food expos, and workshops across Ahmedabad.' },
            { icon: Ticket, title: '2. Instant Ticket Passes', desc: 'Choose your ticket tier, complete digital booking, and receive instant QR passes.' },
            { icon: MapPin, title: '3. Luxury Party Plots', desc: 'Explore open-air lawns, banquets, and celebration venues with verified specs.' },
            { icon: Handshake, title: '4. Partner Ecosystem', desc: 'Party plot hosts approve date requests while organizers publish ticketing options.' }
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3 w-fit rounded-xl bg-purple-500/20 text-purple-400">
                    <IconComponent size={20} />
                  </div>
                  <h4 className="font-display text-base font-bold text-white">{item.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. STATISTICS COUNTER  */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left border-b border-white/10 pb-16">
        <div className="glass-card p-6 rounded-2xl space-y-1">
          <span className="text-3xl font-display font-extrabold text-gradient block">
            <CountUp end={500} suffix="+" duration={2} />
          </span>
          <span className="text-xs font-bold text-slate-300 block">Verified Events</span>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-1">
          <span className="text-3xl font-display font-extrabold text-gradient block">
            <CountUp end={120} suffix="+" duration={2} />
          </span>
          <span className="text-xs font-bold text-slate-300 block">Party Plots</span>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-1">
          <span className="text-3xl font-display font-extrabold text-gradient block">
            <CountUp end={50000} suffix="+" duration={2} />
          </span>
          <span className="text-xs font-bold text-slate-300 block">Passes Issued</span>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-1">
          <span className="text-3xl font-display font-extrabold text-gradient block">
            <CountUp end={99.8} decimals={1} suffix="%" duration={2} />
          </span>
          <span className="text-xs font-bold text-slate-300 block">Satisfaction</span>
        </div>
      </section>

      {/* 5. TEAM SHOWCASE */}
      <section className="space-y-10 text-left">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Leadership & Team</span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white mt-1">Engineered by Event Pioneers</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: 'Jeet Solanki', role: 'Team Member', img: '/jeet.jpg' },
            { name: 'Maru Arya', role: 'Team Member', img: '/arya.jpg' },
            { name: 'Mahin Patel', role: 'Team Member', img: '/mahin.jpg' }
          ].map((mem, idx) => (
            <div key={idx} className="glass-card p-4 rounded-3xl group space-y-4">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#1F1F2E]">
                <img 
                  src={mem.img} 
                  alt={mem.name} 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop';
                  }}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
              <div className="px-2 pb-2">
                <h4 className="font-display font-bold text-white text-lg">{mem.name}</h4>
                {mem.role && <p className="text-xs text-pink-400 font-semibold">{mem.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
