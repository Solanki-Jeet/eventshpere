import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Eye, Trash, Loader2, Info, 
  Ticket, CreditCard, ShieldCheck, XCircle, AlertTriangle, Calendar 
} from 'lucide-react';
import api from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/interactions/notifications/');
      setNotifications(response.data);
    } catch (err) {
      setError('Failed to fetch notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggleRead = async (n) => {
    const newStatus = !n.is_read;
    try {
      await api.patch(`/api/interactions/notifications/${n.id}/`, {
        is_read: newStatus
      });
      setNotifications(prev =>
        prev.map(item => item.id === n.id ? { ...item, is_read: newStatus } : item)
      );
    } catch (err) {
      console.error('Failed to toggle notification read status.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/interactions/notifications/mark-all-read/');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read.', err);
      setError('Failed to mark all notifications as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/interactions/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification.');
    }
  };

  const getNotificationConfig = (title = '', message = '') => {
    const text = (title + ' ' + message).toLowerCase();
    
    if (text.includes('booking successful') || text.includes('ticket booking') || text.includes('booking approved')) {
      return {
        icon: Ticket,
        colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        badge: 'Booking Approved'
      };
    }
    if (text.includes('booking cancelled') || text.includes('booking rejected') || text.includes('cancelled')) {
      return {
        icon: XCircle,
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        badge: 'Cancelled'
      };
    }
    if (text.includes('payment successful') || text.includes('payment') || text.includes('paid')) {
      return {
        icon: CreditCard,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        badge: 'Payment Successful'
      };
    }
    if (text.includes('approved') || text.includes('venue approved')) {
      return {
        icon: ShieldCheck,
        colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        badge: 'Venue Approved'
      };
    }
    if (text.includes('warning') || text.includes('failed') || text.includes('rejection')) {
      return {
        icon: AlertTriangle,
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        badge: 'Alert'
      };
    }
    return {
      icon: Bell,
      colorClass: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
      badge: 'System'
    };
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0B0B12]">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white font-sans py-12 px-4 md:px-8 max-w-4xl mx-auto space-y-10 text-left relative overflow-hidden">
      
      {/* Glow Mesh Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="rounded-3xl border border-white/10 bg-[#151522]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 md:p-12 space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Updates</span>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white mt-1 flex items-center gap-3">
              <Bell className="text-purple-400" size={28} />
              Notifications
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-2">
              You have{' '}
              <span className="text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-xs">
                {unreadCount} unread
              </span>{' '}
              notifications
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#0B0B12] border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Check size={14} className="text-purple-400" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const config = getNotificationConfig(n.title, n.message);
                const IconComp = config.icon;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-2xl border bg-[#0B0B12] border-purple-500/30 border-l-4 border-l-purple-500 shadow-lg shadow-purple-950/20 transition-all flex justify-between items-start gap-4"
                  >
                    <div className="flex gap-4 items-start text-left">
                      <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 border ${config.colorClass}`}>
                        <IconComp size={18} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-base text-white">
                            {n.title}
                          </h3>
                          {!n.is_read ? (
                            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block shrink-0 animate-pulse" title="Unread" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-slate-600 inline-block shrink-0" title="Read" />
                          )}
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${config.colorClass}`}>
                            {config.badge}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed max-w-xl text-white font-semibold">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-purple-400 font-medium block pt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleRead(n)}
                        className={`p-2.5 rounded-xl bg-[#151522] border transition-all cursor-pointer ${
                          !n.is_read
                            ? 'border-purple-500/30 text-purple-300 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'border-white/10 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/10'
                        }`}
                        title={n.is_read ? "Mark as unread" : "Mark as read"}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-2.5 rounded-xl bg-[#151522] border border-white/10 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-[#0B0B12]/50 p-8 text-slate-400 text-xs">
                <Info className="mx-auto mb-3 text-purple-400/50" size={32} />
                <h3 className="font-display text-xl font-bold text-white">No Notifications</h3>
                <p className="text-slate-400 text-xs mt-1">
                  We'll notify you here when bookings are updated or payments clear.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
