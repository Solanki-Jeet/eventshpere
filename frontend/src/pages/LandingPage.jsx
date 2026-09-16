import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Ticket, MapPin, ShieldCheck, 
  Star, Users, Heart, Sparkles, ArrowRight, Search, 
  Music, GlassWater, Landmark, BookOpen, Briefcase, Play, CheckCircle2, Award, Zap,
  Building2, ChevronDown, Compass
} from 'lucide-react';
import api from '../services/api';
import CountUp from '../components/CountUp';

const LandingPage = () => {
  const navigate = useNavigate();

  // API Data states
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search input states (Events, Venues, Date, City)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVenue, setSearchVenue] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchCity, setSearchCity] = useState('Ahmedabad');

  // Video Modal
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const eventsRes = await api.get('/api/events/');
        setEvents(eventsRes.data.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch featured events:", err);
      }
      try {
        const venuesRes = await api.get('/api/venues/');
        setVenues(venuesRes.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch featured venues:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set('search', searchQuery);
    if (searchVenue) queryParams.set('venue', searchVenue);
    if (searchDate) queryParams.set('date', searchDate);
    if (searchCity) queryParams.set('city', searchCity);
    navigate(`/explore?${queryParams.toString()}`);
  };

  // Fallback data for dark luxury showcase
  const fallbackEvents = [
    {
      id: 'f1',
      title: 'Heritage Garba & Gala Night',
      venue_details: { name: 'Sabarmati Riverfront Lawns' },
      location: 'Riverfront, Ahmedabad',
      price: '₹499 onwards',
      date: 'Oct 12 - Oct 20',
      category: 'Festival',
      images: ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&fit=crop'],
    },
    {
      id: 'f2',
      title: 'Neon Underground Beats & DJ Summit',
      venue_details: { name: 'Shankus Party Plot VIP Arena' },
      location: 'Sindhu Bhavan Marg, Ahmedabad',
      price: '₹1,499 onwards',
      date: 'Nov 05, 2026',
      category: 'Music',
      images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&fit=crop'],
    },
    {
      id: 'f3',
      title: 'Karnavati Tech & Innovation Summit',
      venue_details: { name: 'Grand Banquets Hall' },
      location: 'S.G. Highway, Ahmedabad',
      price: '₹1,200 onwards',
      date: 'Dec 18, 2026',
      category: 'Business',
      images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&fit=crop'],
    },
    {
      id: 'f4',
      title: 'Gourmet Food & Wine Expo',
      venue_details: { name: 'Gujarat University Grounds' },
      location: 'Memnagar, Ahmedabad',
      price: '₹299 Entry',
      date: 'Jan 22 - Jan 25',
      category: 'Food',
      images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&fit=crop'],
    }
  ];

  const fallbackVenues = [
    {
      id: 'v1',
      name: 'Shankus Royal Party Plot & Palms',
      location: 'Sindhu Bhavan Marg, Ahmedabad',
      capacity: '1,500 Guests',
      price: '₹85,000 / day',
      images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1000&fit=crop'],
    },
    {
      id: 'v2',
      name: 'Sabarmati Luxury Celebration Lawns',
      location: 'Sabarmati Riverfront, Ahmedabad',
      capacity: '2,500 Guests',
      price: '₹1,40,000 / day',
      images: ['https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1000&fit=crop'],
    },
    {
      id: 'v3',
      name: 'The Empire Heritage Banquet & Resort',
      location: 'Bodakdev, S.G. Highway',
      capacity: '800 Guests',
      price: '₹65,000 / day',
      images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&fit=crop'],
    }
  ];

  const categories = [
    { name: 'Music & DJ Concerts', icon: Music, code: 'music' },
    { name: 'Garba & Festivals', icon: Calendar, code: 'festival' },
    { name: 'Food & Gourmet Expos', icon: GlassWater, code: 'food' },
    { name: 'Masterclasses', icon: BookOpen, code: 'workshop' },
    { name: 'Cultural Exhibits', icon: Landmark, code: 'exhibition' },
    { name: 'Business Summits', icon: Briefcase, code: 'business' },
  ];

  const displayedEvents = events.length > 0 ? events : fallbackEvents;
  const displayedVenues = venues.length > 0 ? venues : fallbackVenues;

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans space-y-24 md:space-y-32 pb-24 overflow-x-hidden relative">
      
      {/* 1. FULL-WIDTH CONCERT HERO BANNER WITH PARALLAX & GRADIENT OVERLAY */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-between pt-20 pb-10 px-4 md:px-8 overflow-hidden">
        
        {/* Cleaned Concert Crowd Background Image with 45% Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0 scale-105"
          style={{ backgroundImage: `url('/concert_hero_bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B12]/90 via-[#0B0B12]/60 to-[#0B0B12] z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10 my-auto text-center space-y-8 pt-8">
          
          {/* H1 Type Scale: 64px, Weight 700, Line Height 110%, Letter Spacing -2px */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="h1-hero max-w-5xl mx-auto"
          >
            Ahmedabad's Premier <br />
            <span className="text-[#7C3AED]">Event Management</span> Platform
          </motion.h1>

          {/* Subtitle Body Scale: 17px, Weight 400, Line Height 170%, Max Width 650-700px */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="body-p mx-auto text-center"
          >
            Discover high-octane concerts, garba nights, and book luxury party plots. Creating unforgettable celebration experiences across Gujarat.
          </motion.p>

          {/* Solid Buttons System */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              to="/explore"
              className="btn-primary text-sm lg:text-base font-semibold px-8 py-3.5 flex items-center gap-3 shadow-md"
            >
              <span>Explore Events</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/explore?type=party_plot"
              className="btn-secondary text-sm lg:text-base font-semibold px-8 py-3.5 flex items-center gap-3"
            >
              <span>Book a Venue</span>
              <Building2 size={16} className="text-purple-400" />
            </Link>
          </motion.div>

        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative z-10 flex flex-col items-center gap-2 pt-6 pointer-events-none"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scroll to Explore</span>
          <ChevronDown size={18} className="text-pink-400 animate-bounce" />
        </motion.div>

      </section>

      {/* 2. BOLD STATISTICAL STRIP */}
      <section className="relative bg-[#151522] border-y border-white/10 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          
          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-display font-extrabold text-gradient block">
              <CountUp end={500} suffix="+" duration={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">Events Hosted</span>
            <p className="text-xs text-slate-400 pt-1">Concerts, garba & summits across Gujarat.</p>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-display font-extrabold text-gradient block">
              <CountUp end={120} suffix="+" duration={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">Party Plots</span>
            <p className="text-xs text-slate-400 pt-1">Verified lawns & grand banquet spaces.</p>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-display font-extrabold text-gradient block">
              <CountUp end={50} suffix="k+" duration={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">Passes Issued</span>
            <p className="text-xs text-slate-400 pt-1">Secure QR gate check-in passes.</p>
          </div>

          <div className="space-y-1">
            <span className="text-4xl md:text-5xl font-display font-extrabold text-gradient block">
              <CountUp end={99.8} decimals={1} suffix="%" duration={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">Satisfaction</span>
            <p className="text-xs text-slate-400 pt-1">Top-rated coordination by organizers.</p>
          </div>

        </div>
      </section>

      {/* 3. FEATURED EVENTS CARDS GRID */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto text-left space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Live Listings</span>
            <h2 className="h2-section mt-1">
              Featured Events & Concerts
            </h2>
          </div>
          <Link 
            to="/explore"
            className="nav-link text-[15px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-2 transition-colors"
          >
            <span>View All Events</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayedEvents.map((ev, idx) => (
            <motion.div
              key={ev.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full"
            >
              {/* Image Frame */}
              <div className="aspect-[4/3] relative overflow-hidden bg-[#181825]">
                <img 
                  src={ev.images?.[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&fit=crop'} 
                  alt={ev.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 badge-purple text-xs font-semibold px-3 py-1 rounded-lg backdrop-blur-md">
                  {ev.category || 'Event'}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="card-title text-[22px] font-semibold text-white group-hover:text-[#7C3AED] transition-colors leading-snug">
                    {ev.title}
                  </h3>
                  <div className="space-y-1.5 text-sm text-[#B8BCC8]">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#7C3AED] shrink-0" />
                      <span className="truncate">{ev.venue_details?.name || ev.location}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#7C3AED] shrink-0" />
                      <span>{ev.date}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="font-bold text-sm text-[#7C3AED]">
                    {ev.price}
                  </span>
                  <Link
                    to={`/explore`}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-[#7C3AED] transition-all"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. LUXURY PARTY PLOTS SHOWCASE */}
      <section className="bg-[#181825]/60 border-y border-white/10 py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-10 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Hospitality Spaces</span>
              <h2 className="h2-section mt-1">
                Luxury Party Plots & Banquets
              </h2>
            </div>
            <Link 
              to="/explore"
              className="nav-link text-[15px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-2 transition-colors"
            >
              <span>Explore All Plots</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {displayedVenues.map((v, idx) => (
              <motion.div
                key={v.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden group space-y-4 p-5"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-xl relative bg-[#181825]">
                  <img 
                    src={v.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1000&fit=crop'} 
                    alt={v.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 badge-purple text-xs font-semibold px-3 py-1 rounded-lg backdrop-blur-md">
                    Verified Host
                  </div>
                </div>

                <div className="px-1 space-y-3">
                  <h3 className="card-title text-[22px] font-semibold text-white">{v.name}</h3>
                  <p className="card-subtitle text-[16px] text-[#B8BCC8] flex items-center gap-2">
                    <MapPin size={14} className="text-[#7C3AED] shrink-0" />
                    <span>{v.location}</span>
                  </p>
                  
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-[#B8BCC8]">
                      <Users size={15} className="text-[#7C3AED]" />
                      <span>{v.capacity}</span>
                    </div>
                    <span className="font-semibold text-[#7C3AED]">{v.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. CATEGORIES INTERACTIVE GRID */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto text-left space-y-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Curated Experiences</span>
          <h2 className="h2-section mt-1">Browse by Category</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => {
            const IconComp = c.icon;
            return (
              <motion.button
                key={c.code}
                onClick={() => navigate(`/explore?category=${c.code}`)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="p-6 glass-card rounded-2xl text-left space-y-4 cursor-pointer group"
              >
                <div className="p-3.5 w-fit rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
                  <IconComp size={22} />
                </div>
                <span className="font-semibold text-[16px] text-white block leading-snug">{c.name}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 6. HOW IT WORKS 3-STEP FLOW */}
      <section className="bg-[#181825]/80 border-y border-white/10 py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-left space-y-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Seamless Operating Protocol</span>
            <h2 className="h2-section mt-1">How EventSphere Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Plot Owner Rental Approval',
                desc: 'Party plot owners list luxury venues. Event organizers request dates for verified host confirmation.'
              },
              {
                step: '02',
                title: 'Organizer Event Publishing',
                desc: 'Once plot booking is approved, organizers setup ticket tiers, artist lineups, and publish event listings.'
              },
              {
                step: '03',
                title: 'Guest VIP Booking & Pass',
                desc: 'Attendees reserve tickets online and instantly receive a digital QR pass for gate check-in.'
              }
            ].map((st, idx) => (
              <div key={idx} className="p-8 glass-card rounded-2xl space-y-4 relative">
                <span className="h1-hero text-[#7C3AED] block">{st.step}</span>
                <h3 className="card-title text-[22px] font-semibold text-white">{st.title}</h3>
                <p className="card-subtitle text-[16px] text-[#B8BCC8] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. VIP NEWSLETTER & CTA BANNER */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto">
        <div className="p-10 md:p-16 rounded-3xl bg-[#181825] border border-white/10 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="badge-purple text-xs font-semibold px-4 py-1.5 rounded-lg">
              Join Gujarat's Premier Network
            </span>
            <h2 className="h2-section text-white leading-tight">
              Ready to Host or Book Your Next Event?
            </h2>
            <p className="body-p text-[17px] text-[#B8BCC8] leading-relaxed mx-auto">
              Connect with top event planners, party plot owners, and attendees across Gujarat.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="btn-primary text-base font-semibold px-8 py-3.5 shadow-md"
              >
                Create Account Now
              </Link>
              <Link
                to="/explore"
                className="btn-secondary text-base font-semibold px-8 py-3.5"
              >
                Explore Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
