import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
  IndianRupee, Ticket, Calendar, Award, 
  RefreshCw, ListFilter, AlertCircle
} from 'lucide-react';
import api from '../services/api';

// Register Chart.js elements
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

const OrganizerAnalyticsPage = () => {
  const { user } = useSelector((state) => state.auth);

  // Filters State (defaulting to all)
  const [dateRange, setDateRange] = useState('all');

  // Analytics API Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Predictor State variables
  const [predPrice, setPredPrice] = useState('');
  const [predQty, setPredQty] = useState('');
  const [predCategory, setPredCategory] = useState('Concert');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictedValue, setPredictedValue] = useState(null);
  const [predictionFeedback, setPredictionFeedback] = useState('');

  const handlePredictRevenue = async () => {
    setIsPredicting(true);
    setPredictionFeedback('');
    try {
      const response = await api.post('/api/analytics/predict-revenue/', {
        ticket_price: parseFloat(predPrice),
        total_tickets: parseInt(predQty),
        category: predCategory
      });
      setPredictedValue(response.data.predicted_revenue);
      if (response.data.reason) {
        setPredictionFeedback(response.data.reason);
      }
    } catch (err) {
      console.error(err);
      alert('Prediction model error. Using fallback estimate.');
      setPredictedValue(parseFloat(predPrice) * parseInt(predQty) * 0.70);
    } finally {
      setIsPredicting(false);
    }
  };

  // Fetch dashboard data from the unified Pandas + NumPy backend
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/api/analytics/organizer-pandas-analytics/?date_range=${dateRange}`);
      setAnalyticsData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Chart options configuration
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

  // 1. Monthly Revenue Chart configuration
  const monthlyRevenueConfig = {
    labels: analyticsData?.charts?.monthly_revenue?.map(item => item.label) || [],
    datasets: [{
      label: 'Monthly Revenue (₹)',
      data: analyticsData?.charts?.monthly_revenue?.map(item => item.value) || [],
      borderColor: '#EC4899',
      backgroundColor: 'rgba(236, 72, 153, 0.15)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
    }]
  };

  // 2. Ticket Sales Trend configuration
  const ticketSalesConfig = {
    labels: analyticsData?.charts?.monthly_ticket_sales?.map(item => item.label) || [],
    datasets: [{
      label: 'Tickets Sold Count',
      data: analyticsData?.charts?.monthly_ticket_sales?.map(item => item.value) || [],
      backgroundColor: 'rgba(124, 58, 237, 0.85)',
      borderRadius: 8,
      borderWidth: 0,
    }]
  };

  // 3. Event-wise Performance configuration
  const eventPerfConfig = {
    labels: analyticsData?.charts?.event_performance?.map(item => item.title) || [],
    datasets: [{
      label: 'Event Revenue (₹)',
      data: analyticsData?.charts?.event_performance?.map(item => item.revenue) || [],
      backgroundColor: 'rgba(236, 72, 153, 0.85)',
      borderRadius: 8,
      borderWidth: 0,
    }]
  };

  // 4. Ticket Type performance configuration
  const ticketTypeConfig = {
    labels: analyticsData?.charts?.ticket_type_performance?.map(item => item.name) || [],
    datasets: [{
      data: analyticsData?.charts?.ticket_type_performance?.map(item => item.revenue) || [],
      backgroundColor: [
        'rgba(124, 58, 237, 0.85)',
        'rgba(236, 72, 153, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(168, 85, 247, 0.85)',
        'rgba(244, 63, 94, 0.85)',
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
            <h1 className="text-3xl font-display font-bold tracking-wide text-white">Organizer Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">
              Comprehensive analytics monitoring your sales performance, listings, and ticket revenues.
            </p>
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

        {/* AI Revenue Predictor Widget card */}
        <div className="bg-[#181825] border border-white/10 rounded-3xl p-6 shadow-xl text-left space-y-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-1.5">🔮 AI Revenue Estimator</h2>
            <p className="text-[#9CA3AF] text-xs mt-1">Estimate event revenues using Scikit-Learn Linear Regression model based on historical ticket sales patterns.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wide">Ticket Price (₹)</label>
              <input
                type="number"
                value={predPrice}
                onChange={(e) => setPredPrice(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141420] text-xs outline-none focus:border-[#7C3AED] text-white placeholder-slate-400 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wide">Total Tickets</label>
              <input
                type="number"
                value={predQty}
                onChange={(e) => setPredQty(e.target.value)}
                placeholder="e.g. 200"
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141420] text-xs outline-none focus:border-[#7C3AED] text-white placeholder-slate-400 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wide">Event Category</label>
              <select
                value={predCategory}
                onChange={(e) => setPredCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141420] text-xs outline-none focus:border-[#7C3AED] text-white cursor-pointer font-semibold"
              >
                <option value="Concert" className="bg-[#141420] text-white">Concert</option>
                <option value="Festival" className="bg-[#141420] text-white">Festival</option>
                <option value="Conference" className="bg-[#141420] text-white">Conference</option>
                <option value="Music & Food" className="bg-[#141420] text-white">Music & Food</option>
                <option value="Other" className="bg-[#141420] text-white">Other</option>
              </select>
            </div>
            <button
              onClick={handlePredictRevenue}
              disabled={isPredicting || !predPrice || !predQty}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer disabled:opacity-50 h-[38px] flex items-center justify-center gap-1.5"
            >
              {isPredicting ? 'Calculating...' : 'Estimate Revenue'}
            </button>
          </div>

          {predictedValue !== null && (
            <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wide">Estimated Event Revenue</div>
                <div className="text-xl font-black text-emerald-400 mt-1">₹{Math.round(predictedValue).toLocaleString()}</div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 max-w-sm italic">
                * Note: This value is a predicted estimate, not guaranteed revenue. {predictionFeedback && `(${predictionFeedback})`}
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-200 rounded-3xl animate-pulse p-4 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-6 w-24 bg-slate-200 rounded mt-2"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded mt-1"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle size={36} />
            <h3 className="font-extrabold text-sm">Failed to Load Analytics</h3>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Ticket Revenue', value: `₹${(analyticsData?.summary?.total_ticket_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-[#7C3AED] bg-[#7C3AED]/20 border-[#7C3AED]/30' },
                { label: 'Tickets Sold', value: analyticsData?.summary?.total_tickets_sold || 0, icon: Ticket, color: 'text-purple-300 bg-purple-500/20 border-purple-500/30' },
                { label: 'Average Ticket Price', value: `₹${Math.round(analyticsData?.summary?.average_ticket_price || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' },
                { label: 'Total Managed Events', value: analyticsData?.summary?.total_events || 0, icon: Calendar, color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' },
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

            {/* Status & Highlights Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Event status break down */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Event Approval Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Approved', val: analyticsData?.summary?.approved_events || 0, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                    { label: 'Pending', val: analyticsData?.summary?.pending_events || 0, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                    { label: 'Rejected', val: analyticsData?.summary?.rejected_events || 0, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                  ].map((status, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-center ${status.color}`}>
                      <div className="text-xs font-black">{status.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-1">{status.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top performing highlight */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl lg:col-span-2 flex flex-col justify-center gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Most Successful Event</h3>
                {analyticsData?.summary?.most_successful_event ? (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-2xl text-[#7C3AED] shrink-0">
                      <Award size={32} />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white">{analyticsData.summary.most_successful_event.title}</div>
                      <div className="text-xs text-[#9CA3AF] mt-1">
                        Generated <strong className="text-emerald-400">₹{analyticsData.summary.most_successful_event.revenue.toLocaleString()}</strong> in ticket sales with <strong className="text-white">{analyticsData.summary.most_successful_event.tickets_sold} tickets</strong>.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">No tickets sold or event activity recorded yet.</div>
                )}
              </div>
            </div>

            {/* Charts Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Line: Monthly Revenue */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Monthly Revenue</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Total revenue generated grouped by booking month.</p>
                </div>
                <div className="h-64">
                  {analyticsData?.charts?.monthly_revenue?.length > 0 ? (
                    <Line data={monthlyRevenueConfig} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

              {/* Bar: Ticket Sales */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Ticket Sales Trend</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Monthly breakdown of ticket entry distribution.</p>
                </div>
                <div className="h-64">
                  {analyticsData?.charts?.monthly_ticket_sales?.length > 0 ? (
                    <Bar data={ticketSalesConfig} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

              {/* Bar: Event Performance */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Event Revenue Performance</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Comparative revenue details of individual events.</p>
                </div>
                <div className="h-64">
                  {analyticsData?.charts?.event_performance?.length > 0 ? (
                    <Bar data={eventPerfConfig} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

              {/* Pie: Ticket Type performance */}
              <div className="p-6 bg-[#181825] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Ticket Category Performance</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Ticket sales splits across passes.</p>
                </div>
                <div className="h-64 flex justify-center">
                  {analyticsData?.charts?.ticket_type_performance?.length > 0 ? (
                    <Pie data={ticketTypeConfig} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No data recorded.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default OrganizerAnalyticsPage;
