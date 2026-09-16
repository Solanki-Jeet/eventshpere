import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Calendar, IndianRupee, Trash2, Loader2, Info, Users } from 'lucide-react';
import api from '../services/api';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('venues'); // venues or events
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/api/interactions/wishlist/');
      setWishlist(response.data);
    } catch (err) {
      setError('Failed to fetch wishlist items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (itemId, type, id) => {
    try {
      // Toggle API call deletes it from DB
      await api.post('/api/interactions/wishlist/toggle/', {
        [type]: id
      });
      // Filter state locally to trigger animation immediately
      setWishlist(wishlist.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Failed to remove item from wishlist.');
    }
  };

  const filteredItems = wishlist.filter(item => {
    if (activeTab === 'venues') return !!item.venue_details;
    return !!item.event_details;
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0B0B12]">
        <Loader2 className="animate-spin text-pink-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white font-sans py-12 px-4 md:px-8 max-w-7xl mx-auto space-y-10 text-left relative overflow-hidden">
      
      {/* Glow Mesh Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 md:p-12 space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Saved Items</span>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white mt-1 flex items-center gap-3">
              <Heart className="text-pink-500 fill-pink-500" size={28} />
              My Saved Wishlist
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">
              Keep track of venues you want to rent or events you plan to attend.
            </p>
          </div>

          {/* Tab Controls */}
          <div className="flex rounded-2xl border border-white/10 bg-[#0B0B12] p-1.5">
            <button
              onClick={() => setActiveTab('venues')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'venues'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Venues / Plots
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Events
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {filteredItems.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredItems.map((item) => {
                const details = activeTab === 'venues' ? item.venue_details : item.event_details;
                const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500';
                const displayImage = details.images?.[0] || defaultImage;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-3xl bg-[#0B0B12] border border-white/10 overflow-hidden flex flex-col h-full hover:border-pink-500/40 transition-all duration-300 shadow-lg group"
                  >
                    <div className="h-52 relative overflow-hidden bg-[#151522]">
                      <img src={displayImage} alt={details.name || details.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {activeTab === 'events' && (
                        <span className="absolute top-3 left-3 bg-[#0B0B12]/80 backdrop-blur-md text-pink-300 border border-pink-500/20 text-[9px] font-bold tracking-widest px-3 py-1 rounded-xl uppercase">
                          {details.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow space-y-4">
                      <h3 className="font-display font-bold text-lg text-white line-clamp-1">
                        {details.name || details.title}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-slate-400 text-xs">
                          <MapPin size={15} className="text-pink-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{details.address || details.location || 'Ahmedabad, Gujarat'}</span>
                        </div>
                        
                        {activeTab === 'venues' ? (
                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Users size={15} className="text-purple-400 shrink-0" />
                            <span>Capacity: {details.capacity} guests</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Calendar size={15} className="text-purple-400 shrink-0" />
                            <span>
                              Date:{' '}
                              {details.date && details.date.includes('-') && details.date.split('-')[0].length === 4
                                ? `${details.date.split('-')[2]}-${details.date.split('-')[1]}-${details.date.split('-')[0]}`
                                : details.date}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto border-t border-white/10 pt-4 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {activeTab === 'venues' ? 'Price Per Day' : 'Ticket Price'}
                          </span>
                          <span className="font-bold text-pink-400 text-sm flex items-center mt-0.5">
                            {activeTab === 'events' && ['Concert', 'Social / Garba'].includes(details.category) ? (
                              <span className="text-purple-400 text-xs uppercase font-extrabold">Category-Based Passes</span>
                            ) : (
                              <>
                                <IndianRupee size={13} />
                                {details.price_per_day || details.ticket_price}
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => {
                              const type = activeTab === 'venues' ? 'venue' : 'event';
                              navigate(`/customer?tab=wishlist&bookType=${type}&bookId=${details.id}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-900/30"
                          >
                            {activeTab === 'venues' ? 'Book Venue' : 'Book Event'}
                          </button>
                          <button
                            onClick={() => handleRemove(item.id, activeTab === 'venues' ? 'venue' : 'event', details.id)}
                            className="p-2 border border-white/10 bg-[#151522] text-slate-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-[#0B0B12]/50 p-8 text-slate-400 text-xs"
            >
              <Info className="mx-auto mb-3 text-pink-400/50" size={32} />
              <h3 className="font-display text-xl font-bold text-white">Your wishlist is empty</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                Explore events and venue plots to bookmark items you're interested in!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WishlistPage;
