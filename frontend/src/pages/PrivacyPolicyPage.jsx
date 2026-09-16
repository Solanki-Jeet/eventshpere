import React from 'react';
import { Shield, Eye, Lock, RefreshCw, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const lastUpdated = "August 2026";

  const sections = [
    {
      title: "1. Information We Collect",
      icon: Eye,
      content: "We collect information you provide directly to us when registering an account, booking a party plot venue, creating an event, or communicating with us. This includes your name, email address, phone number, payment details, and company information."
    },
    {
      title: "2. How We Use Your Information",
      icon: RefreshCw,
      content: "We use the collected information to facilitate venue bookings, manage event registrations, process payments, send gate entry notifications, improve our platform experience, and comply with legal obligations."
    },
    {
      title: "3. Data Sharing and Disclosure",
      icon: Lock,
      content: "We do not sell your personal data. We share your information only with organizers (when you buy event tickets) or plot owners (when you book a venue) as necessary to complete your transactions."
    },
    {
      title: "4. Cookies and Tracking",
      icon: Shield,
      content: "We use cookies to keep you logged in, remember your preferences, and analyze platform traffic. You can manage your cookie preferences through your browser settings."
    },
    {
      title: "5. Your Rights & Choices",
      icon: FileText,
      content: "You have the right to access, update, or delete your personal account information at any time through your Profile dashboard or by contacting support@eventsphere.com."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B12] text-slate-100 font-sans max-w-4xl mx-auto px-4 py-16 md:px-8 text-left relative overflow-hidden">
      
      {/* Background glow mesh */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 items-center justify-center border border-purple-500/30 mb-2">
          <Shield size={28} />
        </div>
        <h1 className="text-4xl font-display font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Last updated: {lastUpdated}</p>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 space-y-8">
        <p className="text-slate-300 text-sm leading-relaxed border-b border-white/10 pb-6">
          At EventSphere, accessible from our platform, one of our main priorities is the privacy of our visitors. This Privacy Policy document details the types of information collected and recorded by EventSphere and how we protect it.
        </p>

        <div className="space-y-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 mt-1">
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
          <h3 className="font-display font-bold text-white text-sm mb-2">Concierge Contact</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            If you have questions regarding this policy, please email{' '}
            <a href="mailto:support@eventsphere.com" className="text-pink-400 hover:underline font-bold">
              support@eventsphere.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
