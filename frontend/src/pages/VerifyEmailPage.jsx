import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setVerified } from '../store/authSlice';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.post('http://localhost:8000/api/auth/verify-email/', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // If logged in, update verified status in Redux
        if (isAuthenticated) {
          dispatch(setVerified());
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid or expired verification link.');
      }
    };

    if (token) {
      verifyToken();
    } else {
      setStatus('error');
      setMessage('Missing verification token.');
    }
  }, [token, dispatch, isAuthenticated]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl glass-card bg-white border border-slate-200 shadow-xl shadow-slate-100 text-center relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

        {status === 'verifying' && (
          <div className="py-8">
            <Loader2 className="animate-spin text-primary-500 mx-auto mb-6" size={48} />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Email</h2>
            <p className="text-slate-500 text-sm">Please wait while we confirm your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <CheckCircle2 className="text-green-500 mx-auto mb-6" size={56} />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-3">Email Verified!</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">{message}</p>
            <Link
              to={isAuthenticated ? '/home' : '/login'}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/10 transition-all duration-300 active:scale-98"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Go to Sign In'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <XCircle className="text-red-500 mx-auto mb-6" size={56} />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-3">Verification Failed</h2>
            <p className="text-red-500 text-sm leading-relaxed mb-8">{message}</p>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80 transition-all duration-300 active:scale-98"
            >
              Back to Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
