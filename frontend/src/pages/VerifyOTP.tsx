import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const email = searchParams.get('email');

  if (!email) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      
      if (data.success) {
        localStorage.setItem('accessToken', data.token);
        
        const userResponse = await api.get('/auth/me');
        if (userResponse.data.success) {
          localStorage.setItem('user', JSON.stringify(userResponse.data.user));
          setUser(userResponse.data.user);
          
          toast.success('Email verified!');
          
          if (!userResponse.data.user.profileCompleted) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('OTP resent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafaf9] flex items-center justify-center">
      <motion.button
        onClick={() => navigate('/email-login')}
        className="absolute top-8 left-8 flex items-center gap-2 text-[#666666] hover:text-[#1a1a1a] transition-colors"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-8">
          <h2 className="text-3xl font-semibold text-[#1a1a1a] mb-2 text-center">
            Verify your email
          </h2>
          <p className="text-sm text-[#666666] mb-8 text-center">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-[#1a1a1a]">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#666666] mb-2">
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 transition-all text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || otp.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 shadow-lg font-medium"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-[#666666] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
