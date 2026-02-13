import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GridBg } from '../components/GridBg';
import { Mail } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();

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
            <div className="w-16 h-16 bg-[#ff6392]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#ff6392]" />
            </div>
            <h2 className="text-2xl font-display mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification code to your email address. Please check your inbox and enter the code on the verification page.
            </p>
            <button
              onClick={() => navigate('/email-login')}
              className="px-6 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
