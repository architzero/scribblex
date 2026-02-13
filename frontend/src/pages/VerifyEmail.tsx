import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { GridBg } from '../components/GridBg';
import api from '../lib/api';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Email verified successfully!');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafaf9]">
      <GridBg />

      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
            {status === 'loading' && (
              <>
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-600">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-display mb-2">Email Verified!</h2>
                <p className="text-gray-600">Redirecting to dashboard...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-display mb-2">Verification Failed</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a]"
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
