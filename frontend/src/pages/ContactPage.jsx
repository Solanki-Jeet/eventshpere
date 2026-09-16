import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, Phone, MapPin, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans space-y-16 py-16 px-4 md:px-8 max-w-7xl mx-auto relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="text-left border-b border-white/10 pb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300 mb-3">
          <Mail size={14} />
          <span className="text-[11px] font-bold uppercase tracking-widest">24/7 Support</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white">Contact Concierge</h1>
        <p className="text-slate-400 text-sm max-w-lg mt-2 leading-relaxed">
          Have inquiries regarding party plot bookings, ticket passes, or event organization? Our team is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info Cards */}
        <div className="lg:col-span-4 space-y-4 text-left">
          <div className="glass-card p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 w-fit rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <span className="block font-display font-bold text-white text-sm mb-0.5">VIP Email Support</span>
              <span className="text-slate-400 text-xs">vip@eventsphere.com</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 w-fit rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <span className="block font-display font-bold text-white text-sm mb-0.5">Concierge Phone</span>
              <span className="text-slate-400 text-xs">+91 (079) 4900 8800</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 w-fit rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <span className="block font-display font-bold text-white text-sm mb-0.5">Corporate HQ</span>
              <span className="text-slate-400 text-xs leading-relaxed">
                SG Highway, Bodakdev, Ahmedabad, Gujarat 380054
              </span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 w-fit rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="block font-display font-bold text-white text-sm mb-0.5">Operating Hours</span>
              <span className="text-slate-400 text-xs block">Mon - Sat: 9:00 AM - 9:00 PM</span>
              <span className="text-pink-400 text-[10px] font-bold block mt-1">Concierge Line Open 24/7</span>
            </div>
          </div>
        </div>

        {/* Glassmorphic Contact Form */}
        <div className="lg:col-span-8 glass-card p-8 rounded-3xl text-left border border-white/10">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="contact-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Your Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="username"
                      required
                      className="w-full px-4 py-3 bg-[#0B0B12] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="abc@example.com"
                      required
                      className="w-full px-4 py-3 bg-[#0B0B12] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Inquiry Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Party plot booking, ticketing, or general inquiry..."
                    className="w-full px-4 py-3 bg-[#0B0B12] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Your Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detail your request or inquiry..."
                    required
                    className="w-full px-4 py-3 bg-[#0B0B12] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {isSubmitting ? (
                    <span>Transmitting...</span>
                  ) : (
                    <>
                      <span>Transmit Request</span>
                      <Send size={15} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="contact-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">Inquiry Received</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Thank you for reaching out to EventSphere Concierge. A member of our executive support team will contact you shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="btn-glass px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  Send Another Message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dark Map Mock Section */}
      <div className="glass-card p-6 rounded-3xl text-left space-y-4">
        <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <MapPin size={20} className="text-pink-400" />
          Ahmedabad Headquarters Location
        </h3>
        <div className="h-64 rounded-2xl overflow-hidden bg-[#151522] border border-white/10 relative flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&fit=crop" 
            alt="Ahmedabad Map" 
            className="w-full h-full object-cover opacity-40" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B12] via-transparent to-transparent" />
          <div className="absolute p-4 rounded-2xl bg-[#151522]/90 border border-white/15 backdrop-blur-md text-center space-y-1 shadow-2xl">
            <span className="badge-pink text-[9px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">EventSphere HQ</span>
            <p className="text-xs font-bold text-white">Bodakdev, S.G. Highway, Ahmedabad</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ContactPage;
