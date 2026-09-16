import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Plus, Minus, HelpCircle, Sparkles } from 'lucide-react';

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaqId, setOpenFaqId] = useState(1);

  const categories = ['All', 'General', 'Bookings', 'Events', 'Payments', 'Security'];

  const faqData = [
    {
      id: 1,
      category: 'GENERAL',
      q: 'What is EventSphere?',
      a: 'EventSphere is a luxury platform matching local party plot owners, event organizers, and customers to streamline venue bookings, event listings management, and digital QR entry tickets in Ahmedabad.'
    },
    {
      id: 2,
      category: 'GENERAL',
      q: 'Who can register on the platform?',
      a: 'We support four user roles: Customers (explore & buy tickets), Plot Owners (register & rent party plots), Organizers (book party plots & host events), and System Admins (review & moderate listings).'
    },
    {
      id: 3,
      category: 'VENUE BOOKINGS',
      q: 'How do I book a party plot/venue?',
      a: 'Organizers and Customers select an approved party plot, choose desired dates, and submit a rental request. The request goes directly to the respective Plot Owner for instant review.'
    },
    {
      id: 4,
      category: 'VENUE BOOKINGS',
      q: 'Can a Plot Owner reject my booking request?',
      a: 'Yes. Plot owners review availability and conflicts. If there is a date conflict or scheduling issue, the plot owner can reject the request.'
    },
    {
      id: 5,
      category: 'VENUE BOOKINGS',
      q: 'How does payment work for venue bookings?',
      a: 'Once the Plot Owner approves a booking, its status updates to APPROVED. You can then click "Pay Rental" to complete the payment via our secure checkout gateway.'
    },
    {
      id: 6,
      category: 'EVENT CREATION',
      q: 'How can an organizer create an event?',
      a: 'Organizers click "Create Event", select a confirmed + paid venue booking, enter event details (title, time, ticket options, images), and submit for Admin review.'
    },
    {
      id: 7,
      category: 'EVENT CREATION',
      q: 'Why cannot I see my event immediately after creation?',
      a: 'All newly created events enter a PENDING state for System Admin approval to ensure quality control. Once approved, the status updates to PUBLISHED and is visible to the public.'
    },
    {
      id: 8,
      category: 'PAYMENTS SYSTEM',
      q: 'How do I view my payment history and ticket passes?',
      a: 'Log in and navigate to your Customer Dashboard or Profile area to see all transactions, active tickets, invoice logs, and QR gate passes.'
    },
    {
      id: 9,
      category: 'TICKETS & SECURITY',
      q: 'How are entry tickets verified at the gate?',
      a: 'Every purchased ticket comes with a unique gate entry pass showing a secure QR code. Event staff scan this code using our dashboard system to confirm authenticity and prevent double entry.'
    }
  ];

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = 
      selectedCategory === 'All' || 
      item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'Bookings' && item.category === 'VENUE BOOKINGS') ||
      (selectedCategory === 'Events' && item.category === 'EVENT CREATION') ||
      (selectedCategory === 'Payments' && item.category === 'PAYMENTS SYSTEM') ||
      (selectedCategory === 'Security' && item.category === 'TICKETS & SECURITY');
    
    const matchesQuery = 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans space-y-12 py-16 px-4 md:px-8 max-w-5xl mx-auto text-left relative">
      
      {/* Glow mesh background */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-purple-400 uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Landing</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-white/10 pb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300">
          <HelpCircle size={14} />
          <span className="text-[11px] font-bold uppercase tracking-widest">Knowledge Base</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white">Frequently Asked Questions</h1>
        <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
          Find comprehensive answers regarding party plot rentals, event publishing, payment verification, and gate pass security.
        </p>

        {/* Search */}
        <div className="relative max-w-lg mt-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7C3AED]">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-11 pr-4 py-3 bg-[#151522] border border-white/10 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#7C3AED] transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'bg-[#151522] border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-4">
        {filteredFaqs.map((faq) => {
          const isOpen = openFaqId === faq.id;
          return (
            <div
              key={faq.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/10 transition-all"
            >
              <button
                onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                className="w-full p-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="space-y-1">
                  <span className="badge-purple text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    {faq.category}
                  </span>
                  <h3 className="font-display font-bold text-white text-base md:text-lg">{faq.q}</h3>
                </div>
                <div className={`p-2 rounded-full border transition-all ${
                  isOpen ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white rotate-180' : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-6 pb-6 border-t border-white/5"
                  >
                    <p className="text-slate-300 text-xs leading-relaxed pt-4 max-w-3xl">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default FAQPage;
