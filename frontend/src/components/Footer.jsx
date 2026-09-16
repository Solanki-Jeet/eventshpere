import React from 'react';
import { Link } from 'react-router-dom';
import { Send, MapPin, Phone, Mail, Globe, Share2, MessageSquare, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-[#0B0B12] text-[#B8B8C5] border-t border-white/10 overflow-hidden pt-16 pb-12 text-left">
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-white/10">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="EventSphere Logo"
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                Event<span className="text-purple-400">Sphere</span>
              </span>
            </Link>

            <p className="text-sm text-[#B8B8C5] max-w-sm leading-relaxed">
              The premier luxury marketplace connecting event organizers, party plot owners, and guests. Experience concerts, gala weddings, and private plot celebrations.
            </p>

            {/* Newsletter input */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Subscribe for VIP Invites</p>
              <div className="flex items-center bg-[#181824] border border-white/10 rounded-xl p-1.5 focus-within:border-[#7C3AED] max-w-md transition-all duration-300">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  className="bg-transparent text-sm text-white focus:outline-none w-full gap-6 placeholder-[#B8B8C5]/60"
                />
                <button className="btn-primary p-3 rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-md">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="footer-heading">Explore</h4>
            <ul className="space-y-2.5 text-[15px] text-[#B8BCC8]">
              <li>
                <Link to="/explore" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Trending Events
                </Link>
              </li>
              <li>
                <Link to="/explore?type=party_plot" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Luxury Party Plots
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> About EventSphere
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> FAQ & Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div className="space-y-4">
            <h4 className="footer-heading">Portals & Roles</h4>
            <ul className="space-y-2.5 text-[15px] text-[#B8BCC8]">
              <li>
                <Link to="/login" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Guest Member
                </Link>
              </li>
              <li>
                <Link to="/login/organizer" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Event Organizer
                </Link>
              </li>
              <li>
                <Link to="/login/plotowner" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Plot Owner Portal
                </Link>
              </li>
              <li>
                <Link to="/login/admin" className="footer-link flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-[#7C3AED]" /> Executive Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="footer-heading">Concierge Contact</h4>
            <ul className="space-y-3 text-[15px] text-[#B8BCC8]">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#7C3AED] shrink-0 mt-1" />
                <span>SG Highway, Bodakdev, Ahmedabad, Gujarat 380054</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#7C3AED] shrink-0" />
                <span>+91 (079) 4900 8800</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#7C3AED] shrink-0" />
                <span>support@eventsphere.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 EventSphere Inc. Crafted for Luxury Event Experiences.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
