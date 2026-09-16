import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Tag, ShieldCheck, CheckCircle2, XCircle,
  Loader2, ArrowRight, Check, AlertTriangle, RefreshCw, X
} from 'lucide-react';
import api from '../services/api';

// ─── UPI App definitions ───────────────────────────────────────────────────
const UPI_APPS = [
  { id: 'gpay',       label: 'Google Pay',   vpa_suffix: 'okicici',  color: '#4285F4' },
  { id: 'phonepe',    label: 'PhonePe',      vpa_suffix: 'ybl',      color: '#5f259f' },
  { id: 'paytm',      label: 'Paytm',        vpa_suffix: 'paytm',    color: '#00b9f1' },
  { id: 'bhim',       label: 'BHIM',         vpa_suffix: 'upi',      color: '#1a237e' },
  { id: 'amazonpay',  label: 'Amazon Pay',   vpa_suffix: 'apl',      color: '#ff9900' },
  { id: 'cred',       label: 'CRED',         vpa_suffix: 'axisb',    color: '#1a1a1a' },
];

// ─── Net Banking bank list ──────────────────────────────────────────────────
const BANKS = [
  { id: 'SBI',   label: 'State Bank of India',    short: 'SBI'   },
  { id: 'HDFC',  label: 'HDFC Bank',              short: 'HDFC'  },
  { id: 'ICICI', label: 'ICICI Bank',             short: 'ICICI' },
  { id: 'AXIS',  label: 'Axis Bank',              short: 'Axis'  },
  { id: 'KOTAK', label: 'Kotak Mahindra Bank',    short: 'Kotak' },
  { id: 'PNB',   label: 'Punjab National Bank',   short: 'PNB'   },
  { id: 'BOB',   label: 'Bank of Baroda',         short: 'BOB'   },
  { id: 'UNION', label: 'Union Bank of India',    short: 'Union' },
  { id: 'CANARA',label: 'Canara Bank',            short: 'Canara'},
  { id: 'IDFC',  label: 'IDFC First Bank',        short: 'IDFC'  },
];

const LOADING_STEPS = [
  'Initiating secure connection...',
  'Contacting payment gateway...',
  'Authorizing with bank...',
  'Finalizing transaction...',
];

// ─── Main Component ─────────────────────────────────────────────────────────
const CheckoutModal = ({ isOpen, onClose, bookingType, bookingId, initialAmount, onSuccess }) => {
  // ── Coupon state ─────────────────────────────────────────────────────────
  const [couponCode,      setCouponCode]      = useState('');
  const [couponError,     setCouponError]     = useState('');
  const [couponSuccess,   setCouponSuccess]   = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalAmount,     setFinalAmount]     = useState(initialAmount);

  // ── Flow state ────────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderData,    setOrderData]    = useState(null);
  const [showSandbox,  setShowSandbox]  = useState(false);

  // ── Payment method state ──────────────────────────────────────────────────
  const [tab,          setTab]          = useState('upi');   // 'upi' | 'card' | 'netbanking'
  const [upiApp,       setUpiApp]       = useState('gpay');
  const [upiId,        setUpiId]        = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [nbStep,       setNbStep]       = useState('select'); // 'select' | 'login' | 'otp'
  const [nbUser,       setNbUser]       = useState('');
  const [nbPass,       setNbPass]       = useState('');
  const [nbOtp,        setNbOtp]        = useState('');

  // ── Card state ────────────────────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv,    setCardCvv]    = useState('');
  const [cardName,   setCardName]   = useState('');

  // ── Animation / result state ──────────────────────────────────────────────
  const [loadingStep,    setLoadingStep]    = useState(-1); // -1 = idle
  const [resultStatus,   setResultStatus]   = useState(null); // null | 'success' | 'failure'
  const [gatewayError,   setGatewayError]   = useState('');

  // ── Derived: final amount ─────────────────────────────────────────────────
  useEffect(() => {
    setFinalAmount(initialAmount - (initialAmount * discountPercent) / 100);
  }, [initialAmount, discountPercent]);

  if (!isOpen) return null;

  // ── Card formatters ────────────────────────────────────────────────────────
  const fmtCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(raw.match(/.{1,4}/g)?.join(' ') || raw);
  };
  const fmtExpiry = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    setCardExpiry(raw);
  };
  const fmtCvv = (e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3));

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(''); setCouponSuccess('');
    try {
      const { data } = await api.get(`/api/payments/coupons/validate/?code=${couponCode}`);
      setDiscountPercent(data.discount_percent);
      setCouponSuccess(`✓ ${data.discount_percent}% discount applied!`);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code.');
      setDiscountPercent(0);
    }
  };

  // ── Proceed to payment (create order) ─────────────────────────────────────
  const handleProceed = async () => {
    setIsProcessing(true);
    setGatewayError('');
    try {
      const { data: order } = await api.post('/api/payments/order/', {
        booking_type: bookingType,
        booking_id:   bookingId,
        coupon_code:  discountPercent > 0 ? couponCode : null,
      });
      setOrderData(order);
      if (order.is_simulated) {
        setShowSandbox(true);
        setIsProcessing(false);
      } else {
        loadRazorpay(order);
      }
    } catch (err) {
      setGatewayError(err.response?.data?.error || 'Failed to create payment order. Please try again.');
      setIsProcessing(false);
    }
  };

  // ── Real Razorpay ──────────────────────────────────────────────────────────
  const loadRazorpay = (order) => {
    if (window.Razorpay) {
      openRazorpay(order);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => openRazorpay(order);
    s.onerror = () => { setGatewayError('Failed to load Razorpay SDK.'); setIsProcessing(false); };
    document.body.appendChild(s);
  };

  const openRazorpay = (order) => {
    const options = {
      key: order.key_id || 'rzp_test_eventsphere2026',
      amount: Math.round(order.amount * 100),
      currency: order.currency || 'INR',
      name: 'EventSphere',
      description: bookingType === 'event' ? 'Event Tickets Booking' : 'Party Plot Venue Rental',
      order_id: order.order_id,
      handler: async (res) => {
        setIsProcessing(true);
        try {
          await api.post('/api/payments/verify/', {
            razorpay_order_id:   res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature:  res.razorpay_signature,
            payment_method:      'razorpay',
          });
          setResultStatus('success');
          setTimeout(() => { onSuccess(); onClose(); resetAll(); }, 2000);
        } catch (err) {
          setResultStatus('failure');
          setGatewayError(err.response?.data?.error || 'Payment signature verification failed.');
          setIsProcessing(false);
        }
      },
      modal: { ondismiss: () => setIsProcessing(false) },
      theme: { color: '#7C3AED' },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      setResultStatus('failure');
      setGatewayError(resp.error?.description || 'Payment transaction failed or was declined.');
      setIsProcessing(false);
    });
    rzp.open();
  };

  // ── Validate before pay ────────────────────────────────────────────────────
  const validate = () => {
    if (tab === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setGatewayError('Please enter a valid UPI ID (e.g. yourname@okicici).');
        return false;
      }
    }
    if (tab === 'card') {
      const cardDigits = cardNumber.replace(/\s/g, '');
      if (cardDigits.length < 16) { setGatewayError('Enter a valid 16-digit card number.'); return false; }
      if (cardExpiry.length < 5)   { setGatewayError('Enter a valid expiry date (MM/YY).'); return false; }
      if (cardCvv.length < 3)      { setGatewayError('Enter a valid 3-digit CVV.'); return false; }
      if (!cardName.trim())        { setGatewayError('Enter the cardholder name.'); return false; }
    }
    if (tab === 'netbanking') {
      if (nbStep === 'login') {
        if (!nbUser.trim() || !nbPass.trim()) { setGatewayError('Enter your net banking User ID and Password.'); return false; }
      }
      if (nbStep === 'otp') {
        if (nbOtp.trim().length < 4) { setGatewayError('Enter the 6-digit OTP sent to your registered mobile.'); return false; }
      }
    }
    return true;
  };

  // ── Simulate payment ───────────────────────────────────────────────────────
  const simulatePay = async (outcome) => {
    if (outcome === 'completed' && !validate()) return;

    setGatewayError('');
    setIsProcessing(true);

    // Animate loading steps
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 700));
    }

    // Build method label
    let methodLabel = tab;
    if (tab === 'upi')        methodLabel = upiApp;
    if (tab === 'netbanking') methodLabel = `netbanking_${selectedBank.toLowerCase()}`;

    try {
      await api.post('/api/payments/verify/', {
        razorpay_order_id: orderData.order_id,
        status:            outcome,
        payment_method:    methodLabel,
      });

      if (outcome === 'completed') {
        setResultStatus('success');
        setTimeout(() => { onSuccess(); onClose(); resetAll(); }, 2000);
      } else {
        setResultStatus('failure');
        setGatewayError('Your bank declined the transaction. Please check your details or try another method.');
        setIsProcessing(false);
        setLoadingStep(-1);
      }
    } catch (err) {
      setResultStatus('failure');
      setGatewayError(err.response?.data?.error || 'Gateway timeout. Please retry.');
      setIsProcessing(false);
      setLoadingStep(-1);
    }
  };

  // ── Reset everything ───────────────────────────────────────────────────────
  const resetAll = () => {
    setCouponCode(''); setCouponError(''); setCouponSuccess('');
    setDiscountPercent(0);
    setOrderData(null); setShowSandbox(false);
    setTab('upi'); setUpiApp('gpay'); setUpiId('');
    setSelectedBank('HDFC'); setNbStep('select'); setNbUser(''); setNbPass(''); setNbOtp('');
    setCardNumber(''); setCardExpiry(''); setCardCvv(''); setCardName('');
    setLoadingStep(-1); setResultStatus(null); setGatewayError('');
    setIsProcessing(false);
  };

  const tryAgain = () => {
    setResultStatus(null);
    setGatewayError('');
    setLoadingStep(-1);
    setIsProcessing(false);
    setNbStep('select');
  };

  // ── Net Banking: advance step ──────────────────────────────────────────────
  const handleNbContinue = () => {
    if (nbStep === 'select') {
      setNbStep('login');
    } else if (nbStep === 'login') {
      if (!nbUser.trim() || !nbPass.trim()) { setGatewayError('Enter User ID and Password to continue.'); return; }
      setGatewayError('');
      setNbStep('otp');
    } else if (nbStep === 'otp') {
      simulatePay('completed');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[#181825] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-left"
        style={{ maxHeight: '95vh' }}
      >
        {/* ─── STEP 1: Pre-payment summary ─────────────────────────────────── */}
        {!showSandbox ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CreditCard className="text-[#7C3AED]" size={20} />
                Secure Checkout
              </h3>
              <button onClick={() => { onClose(); resetAll(); }} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-grow">
              {/* Summary */}
              <div className="p-4 bg-[#141420] border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex justify-between text-xs text-[#9CA3AF] font-semibold">
                  <span>Base Amount</span>
                  <span className="text-white">₹{Number(initialAmount).toLocaleString('en-IN')}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-bold">
                    <span>Discount ({discountPercent}% off)</span>
                    <span>−₹{((initialAmount * discountPercent) / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between font-black text-white">
                  <span>Total Payable</span>
                  <span className="text-[#7C3AED] text-lg font-black">₹{Number(finalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Have a Coupon?</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="E.G. AHMEDABAD20"
                      disabled={isProcessing || discountPercent > 0}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-xs text-white bg-[#141420] uppercase placeholder-slate-400 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing || !couponCode.trim() || discountPercent > 0}
                    className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors shadow-md"
                  >
                    {discountPercent > 0 ? '✓' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-rose-400 font-semibold">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-400 font-semibold">{couponSuccess}</p>}
              </form>

              {/* Security note */}
              <div className="flex gap-2.5 items-start text-[11px] text-slate-300 bg-[#141420] border border-white/10 rounded-xl p-3.5 leading-relaxed">
                <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <span>All transactions are protected by 256-bit SSL encryption. Your payment details are never stored on our servers.</span>
              </div>

              {gatewayError && (
                <div className="flex gap-2 items-start text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{gatewayError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#141420]">
              <button
                onClick={handleProceed}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isProcessing
                  ? <><Loader2 className="animate-spin" size={16} /><span>Creating Order...</span></>
                  : <><span>Proceed to Pay — ₹{Number(finalAmount).toLocaleString('en-IN')}</span><ArrowRight size={16} /></>
                }
              </button>
            </div>
          </>
        ) : (
          /* ─── STEP 2: Sandbox Payment Terminal ─────────────────────────── */
          <>
            {/* Terminal header */}
            <div className="bg-[#141420] px-6 py-4 text-center relative border-b border-white/10">
              <button
                onClick={() => { onClose(); resetAll(); }}
                className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-0.5">Secure Payment Terminal</p>
              <h3 className="font-extrabold text-white text-base">Choose Payment Method</h3>
              <p className="text-[#7C3AED] font-black text-sm mt-1">
                ₹{Number(orderData?.amount).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Loading animation overlay */}
            <AnimatePresence>
              {loadingStep >= 0 && resultStatus === null && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#181825] rounded-3xl space-y-5 p-6"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#7C3AED] animate-spin" />
                    <ShieldCheck className="absolute inset-0 m-auto text-[#7C3AED]" size={22} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-white text-sm">{LOADING_STEPS[loadingStep]}</p>
                    <p className="text-[10px] text-[#9CA3AF] font-semibold">Do not close this window</p>
                  </div>
                  <div className="flex gap-2">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i <= loadingStep ? 'bg-[#7C3AED] w-6' : 'bg-white/10 w-4'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success overlay */}
            <AnimatePresence>
              {resultStatus === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#181825] rounded-3xl space-y-4 p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 className="text-emerald-400" size={64} />
                  </motion.div>
                  <div>
                    <h4 className="font-extrabold text-white text-xl">Payment Successful!</h4>
                    <p className="text-[#9CA3AF] text-sm mt-1">Your booking is confirmed. QR ticket is ready.</p>
                  </div>
                  <div className="text-xs text-purple-300 font-semibold animate-pulse">Redirecting to dashboard...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Failure overlay */}
            <AnimatePresence>
              {resultStatus === 'failure' && (
                <motion.div
                  key="failure"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#181825] rounded-3xl space-y-4 p-8 text-center"
                >
                  <XCircle className="text-rose-400" size={64} />
                  <div>
                    <h4 className="font-extrabold text-white text-lg">Payment Declined</h4>
                    <p className="text-sm text-rose-300 font-semibold mt-2 leading-relaxed max-w-xs">{gatewayError}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={tryAgain}
                      className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={13} />
                      Try Again
                    </button>
                    <button
                      onClick={() => { onClose(); resetAll(); }}
                      className="flex-1 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-white font-bold text-xs border border-white/10 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Method tabs ───────────────────────────────────────────────── */}
            <div className="flex border-b border-white/10">
              {['upi', 'card', 'netbanking'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setGatewayError(''); setNbStep('select'); }}
                  disabled={isProcessing}
                  className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                    tab === t
                      ? 'border-[#7C3AED] text-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'upi' ? 'UPI' : t === 'card' ? 'Card' : 'Net Banking'}
                </button>
              ))}
            </div>

            {/* ── Content area ──────────────────────────────────────────────── */}
            <div className="px-6 py-5 flex-grow overflow-y-auto">
              {gatewayError && resultStatus === null && loadingStep < 0 && (
                <div className="mb-4 flex gap-2 items-start text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{gatewayError}</span>
                </div>
              )}

              {/* ── UPI ─────────────────────────────────────────────────────── */}
              {tab === 'upi' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Choose UPI App</p>
                    <div className="grid grid-cols-3 gap-2">
                      {UPI_APPS.map(app => (
                        <button
                          key={app.id}
                          onClick={() => {
                            setUpiApp(app.id);
                            setUpiId('');
                          }}
                          disabled={isProcessing}
                          className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            upiApp === app.id
                              ? 'border-[#7C3AED] bg-[#7C3AED]/20 text-purple-300 shadow-sm'
                              : 'border-white/10 bg-[#141420] text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {upiApp === app.id && <Check size={10} />}
                          {app.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder={`e.g. yourname@${UPI_APPS.find(a => a.id === upiApp)?.vpa_suffix}`}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 bg-[#141420] disabled:opacity-50"
                    />
                    <p className="text-[10px] text-[#9CA3AF]">
                      A payment request will be sent to this UPI ID for approval.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => simulatePay('completed')}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Pay via {UPI_APPS.find(a => a.id === upiApp)?.label}
                    </button>
                    <button
                      onClick={() => simulatePay('failed')}
                      disabled={isProcessing}
                      className="px-5 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* ── Card ─────────────────────────────────────────────────────── */}
              {tab === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={fmtCardNumber}
                        placeholder="4111 1111 1111 1111"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 font-mono bg-[#141420] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={fmtExpiry}
                        placeholder="08/28"
                        disabled={isProcessing}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 text-center font-mono bg-[#141420] disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={fmtCvv}
                        placeholder="•••"
                        disabled={isProcessing}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 text-center font-mono bg-[#141420] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Name on Card</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="SUMIT GOHEL"
                      disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 uppercase bg-[#141420] disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-2 items-center text-[10px] text-[#9CA3AF] font-semibold">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>Your card details are encrypted and never stored.</span>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => simulatePay('completed')}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Pay Securely
                    </button>
                    <button
                      onClick={() => simulatePay('failed')}
                      disabled={isProcessing}
                      className="px-5 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* ── Net Banking ───────────────────────────────────────────────── */}
              {tab === 'netbanking' && (
                <div className="space-y-4">
                  {/* Step 1: Select bank */}
                  {nbStep === 'select' && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Select Your Bank</p>
                      <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                        {BANKS.map(bank => (
                          <button
                            key={bank.id}
                            onClick={() => setSelectedBank(bank.id)}
                            className={`py-2.5 px-3 rounded-xl text-left border transition-all cursor-pointer ${
                              selectedBank === bank.id
                                ? 'border-[#7C3AED] bg-[#7C3AED]/20 text-purple-300 font-bold'
                                : 'border-white/10 bg-[#141420] text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="text-[11px] font-bold block">{bank.short}</span>
                            <span className="text-[9px] text-[#9CA3AF] block truncate">{bank.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleNbContinue}
                          className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm cursor-pointer transition-colors shadow-md"
                        >
                          Continue to {BANKS.find(b => b.id === selectedBank)?.short} Login
                        </button>
                        <button
                          onClick={() => simulatePay('failed')}
                          disabled={isProcessing}
                          className="px-5 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Net banking login */}
                  {nbStep === 'login' && (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-[#141420] border border-white/10 rounded-2xl">
                        <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-black text-xs">
                          {BANKS.find(b => b.id === selectedBank)?.short.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[10px] text-[#9CA3AF] font-semibold">Secure Login</p>
                          <p className="text-xs text-white font-bold">{BANKS.find(b => b.id === selectedBank)?.label}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">User ID / Customer ID</label>
                          <input
                            type="text"
                            value={nbUser}
                            onChange={e => setNbUser(e.target.value)}
                            placeholder="Enter your net banking User ID"
                            className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 bg-[#141420]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Password</label>
                          <input
                            type="password"
                            value={nbPass}
                            onChange={e => setNbPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-sm text-white placeholder-slate-400 bg-[#141420]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleNbContinue}
                          className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm cursor-pointer transition-colors shadow-md"
                        >
                          Login & Send OTP
                        </button>
                        <button
                          onClick={() => setNbStep('select')}
                          className="px-5 py-3 rounded-2xl bg-[#141420] text-slate-300 font-bold text-xs border border-white/10 cursor-pointer"
                        >
                          Back
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 3: OTP verification */}
                  {nbStep === 'otp' && (
                    <>
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                        <p className="text-xs font-bold text-emerald-300">OTP sent to your registered mobile</p>
                        <p className="text-[10px] text-emerald-400/80 mt-0.5">Enter the 6-digit OTP within 10 minutes</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Enter OTP</label>
                        <input
                          type="text"
                          value={nbOtp}
                          onChange={e => setNbOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="• • • • • •"
                          className="w-full px-4 py-4 rounded-xl border border-white/10 focus:border-[#7C3AED] outline-none text-xl text-white placeholder-slate-400 text-center font-mono tracking-[0.5em] bg-[#141420]"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => simulatePay('completed')}
                          disabled={isProcessing || nbOtp.length < 4}
                          className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          Confirm Payment
                        </button>
                        <button
                          onClick={() => simulatePay('failed')}
                          disabled={isProcessing}
                          className="px-5 py-3 rounded-2xl bg-[#141420] hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 cursor-pointer disabled:opacity-50"
                        >
                          Wrong OTP
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
