import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  IndianRupee, Ticket, Calendar, Award, Home,
  RefreshCw, ListFilter, AlertCircle
} from 'lucide-react';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/api/analytics/admin-pandas-analytics/?date_range=${dateRange}`);
      setAnalyticsData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch platform analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { font: { weight: 'bold', size: 10 }, color: '#CBD5E1' }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 9 } } },
      y: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { color: 'rgba(255, 255, 255, 0.08)' } }
    }
  };

  // 1. Platform Revenue Chart (Tickets vs Venue Rental split)
  const revenueSplitConfig = {
    labels: ['Ticket Sales', 'Venue Rentals'],
    datasets: [{
      data: [
        analyticsData?.revenue?.ticket_revenue || 0,
        analyticsData?.revenue?.venue_rental_revenue || 0
      ],
      backgroundColor: [
        'rgba(124, 58, 237, 0.85)',
        'rgba(236, 72, 153, 0.85)'
      ],
      borderWidth: 1,
    }]
  };

  // 2. Events Category distribution
  const eventCategoriesConfig = {
    labels: Object.keys(analyticsData?.events?.categories || {}),
    datasets: [{
      label: 'Events Count',
      data: Object.values(analyticsData?.events?.categories || {}),
      backgroundColor: 'rgba(236, 72, 153, 0.85)',
      borderRadius: 6,
      borderWidth: 0,
    }]
  };

  // 3. Chronological Monthly revenue timeline
  const monthlyRevenueConfig = {
    labels: analyticsData?.revenue?.monthly_revenue?.map(item => item.label) || [],
    datasets: [{
      label: 'Monthly Income (₹)',
      data: analyticsData?.revenue?.monthly_revenue?.map(item => item.value) || [],
      borderColor: '#EC4899',
      backgroundColor: 'rgba(236, 72, 153, 0.15)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
    }]
  };

  // 4. Booking success rate doughnut
  const bookingSuccessConfig = {
    labels: ['Successful', 'Other / Cancelled'],
    datasets: [{
      data: [
        analyticsData?.venues?.successful_bookings || 0,
        analyticsData?.venues?.other_bookings || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.85)',
        'rgba(239, 68, 68, 0.85)'
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 py-8 px-4 md:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-wide text-white">Platform Analytics</h1>
          </div>
          
          <button
            onClick={() => fetchAnalytics()}
            title="Refresh Data"
            className="p-2.5 rounded-2xl bg-[#151522] border border-white/15 text-slate-300 hover:text-pink-400 hover:bg-white/5 shadow-lg transition-all cursor-pointer flex items-center justify-center self-end md:self-auto"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters Sticky Panel */}
        <div className="sticky top-[73px] z-40 bg-[#181825]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5">
              <ListFilter size={14} className="text-[#7C3AED]" />
              Filter Date Range:
            </span>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-[#141420] text-xs outline-none focus:border-[#7C3AED] text-white cursor-pointer font-medium"
            >
              <option value="7_days" className="bg-[#141420] text-white">Last 7 Days</option>
              <option value="30_days" className="bg-[#141420] text-white">Last 30 Days</option>
              <option value="this_month" className="bg-[#141420] text-white">This Month</option>
              <option value="this_year" className="bg-[#141420] text-white">This Year</option>
              <option value="all" className="bg-[#141420] text-white">All Time</option>
            </select>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-[#181825] border border-white/10 rounded-3xl animate-pulse p-4 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-slate-800 rounded"></div>
                  <div className="h-6 w-24 bg-slate-800 rounded mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle size={36} />
            <h3 className="font-extrabold text-sm text-white">Failed to Load Platform Analytics</h3>
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Platform Revenue', value: `₹${(analyticsData?.revenue?.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-teal-300 bg-teal-500/20 border-teal-500/30' },
                { label: 'Total Bookings', value: analyticsData?.bookings?.total_bookings || 0, icon: Ticket, color: 'text-purple-300 bg-purple-500/20 border-purple-500/30' },
                { label: 'Active Venues', value: analyticsData?.venues?.total_venues || 0, icon: Home, color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' },
                { label: 'Active Events', value: analyticsData?.events?.total_events || 0, icon: Calendar, color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="p-5 bg-[#181825] border border-white/10 rounded-2xl flex flex-col justify-between shadow-xl relative group hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wide">{item.label}</span>
                      <div className={`p-1.5 rounded-lg border ${item.color}`}>
                        <Icon size={14} />
                      </div>
                    </div>
                    <div className="text-xl font-black text-white mt-2">{item.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Platform statistics detailed rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Event status breakdown */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Event</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Approved', val: analyticsData?.events?.status_counts?.approved || 0, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                    { label: 'Pending', val: analyticsData?.events?.status_counts?.pending || 0, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                    { label: 'Rejected', val: analyticsData?.events?.status_counts?.rejected || 0, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                  ].map((status, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-center ${status.color}`}>
                      <div className="text-xs font-black">{status.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-1">{status.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Venue status breakdown */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Venue</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Approved', val: analyticsData?.venues?.status_counts?.approved || 0, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                    { label: 'Pending', val: analyticsData?.venues?.status_counts?.pending || 0, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                    { label: 'Rejected', val: analyticsData?.venues?.status_counts?.rejected || 0, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                  ].map((status, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-center ${status.color}`}>
                      <div className="text-xs font-black">{status.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-1">{status.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking breakdown */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Booking</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Paid', val: analyticsData?.bookings?.status_counts?.paid || 0, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                    { label: 'Cancelled', val: analyticsData?.bookings?.status_counts?.cancelled || 0, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                    { label: 'Pending', val: analyticsData?.bookings?.status_counts?.pending || 0, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                  ].map((status, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-center ${status.color}`}>
                      <div className="text-xs font-black">{status.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-1">{status.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Charts section grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Pie: Platform Revenue Split */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Platform Revenue Split</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Ratio details of ticketing vs venue rental transaction amounts.</p>
                </div>
                <div className="h-64 flex justify-center">
                  <Pie data={revenueSplitConfig} />
                </div>
              </div>

              {/* Bar: Events Category distribution */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Events Category Distribution</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Total events listed across various platform categories.</p>
                </div>
                <div className="h-64">
                  {Object.keys(analyticsData?.events?.categories || {}).length > 0 ? (
                    <Bar data={eventCategoriesConfig} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

              {/* Line: Monthly timeline revenue */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Monthly Revenue Progress</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Total monthly timeline progression of platforms billing.</p>
                </div>
                <div className="h-64">
                  {analyticsData?.revenue?.monthly_revenue?.length > 0 ? (
                    <Line data={monthlyRevenueConfig} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

              {/* Doughnut: Booking Success rate */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Booking Success Conversion Rate</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Doughnut representation of successful paid bookings vs defaults.</p>
                </div>
                <div className="h-64 flex justify-center">
                  <Doughnut data={bookingSuccessConfig} />
                </div>
              </div>

            </div>

            {/* Popular items detailed grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Popular events */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-1">
                  <Award className="text-amber-400" size={18} /> Most Popular Events
                </h3>
                {analyticsData?.events?.most_popular?.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {analyticsData.events.most_popular.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{item.title}</span>
                        <span className="px-2.5 py-1 bg-[#141420] border border-white/10 text-purple-300 font-black rounded-lg">
                          {item.tickets_sold} tickets
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">No popular events recorded yet.</div>
                )}
              </div>

              {/* Booked venues */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-1">
                  <Home className="text-[#7C3AED]" size={18} /> Most Booked Venues
                </h3>
                {analyticsData?.venues?.most_booked?.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {analyticsData.venues.most_booked.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="px-2.5 py-1 bg-[#141420] border border-white/10 text-emerald-300 font-black rounded-lg">
                          {item.bookings_count} bookings
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">No venue bookings recorded yet.</div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
