import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GridBg } from '../components/GridBg';
import api from '../lib/api';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafaf9]">
      <GridBg />

      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-display mb-2">Forgot Password?</h2>
            <p className="text-gray-600 mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 text-gray-600 hover:text-[#1a1a1a]"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <p className="text-gray-600 mb-4">
                  Check your email for the reset link!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="text-[#1a1a1a] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
