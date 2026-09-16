import React from 'react';
import { FileText, ClipboardList, AlertCircle, ShoppingBag, ShieldAlert, Award } from 'lucide-react';

const TermsConditionsPage = () => {
  const lastUpdated = "August 2026";

  const sections = [
    {
      title: "1. User Accounts and Registration",
      icon: ClipboardList,
      content: "To access features such as booking party plots or hosting events, you must register an account. You agree to provide accurate information and keep credentials secure. You are responsible for all activities under your account."
    },
    {
      title: "2. Booking and Payments",
      icon: ShoppingBag,
      content: "All venue and event ticket bookings made through EventSphere are subject to availability and acceptance. Payment details must be valid, and reservations are confirmed upon successful checkout."
    },
    {
      title: "3. Cancellation and Refund Policy",
      icon: AlertCircle,
      content: "Cancellations of venue bookings are subject to the specific terms set by the Plot Owner. Ticket cancellations follow the event organizer's policy."
    },
    {
      title: "4. User Conduct and Responsibilities",
      icon: ShieldAlert,
      content: "Users must utilize the platform in a lawful and respectful manner. You agree not to post false information, engage in fraudulent transactions, or disrupt site operations."
    },
    {
      title: "5. Intellectual Property",
      icon: Award,
      content: "All content, logos, designs, and software on EventSphere are the property of the hub or its licensors and are protected by copyright and intellectual property laws."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans max-w-4xl mx-auto px-4 py-16 md:px-8 text-left relative overflow-hidden">
      
      {/* Background glow mesh */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-pink-500/20 text-pink-400 items-center justify-center border border-pink-500/30 mb-2">
          <FileText size={28} />
        </div>
        <h1 className="text-4xl font-display font-extrabold text-white tracking-tight">Terms & Conditions</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Last updated: {lastUpdated}</p>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 space-y-8">
        <p className="text-slate-300 text-sm leading-relaxed border-b border-white/10 pb-6">
          Welcome to EventSphere. These terms and conditions outline the rules and regulations for the use of EventSphere's platform. By accessing this website, we assume you accept these terms and conditions in full.
        </p>

        <div className="space-y-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30 mt-1">
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-base mb-2">{section.title}</h2>
                  <p className="text-slate-400 text-xs leading-relaxed">{section.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 pt-6 mt-8">
          <h3 className="font-display font-bold text-white text-sm mb-2">Legal Support</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            If you have questions regarding these terms, please email{' '}
            <a href="mailto:support@eventsphere.com" className="text-purple-400 hover:underline font-bold">
              support@eventsphere.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
