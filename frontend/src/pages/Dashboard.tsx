import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AnimatedTitle } from '../components/AnimatedTitle';
import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 font-display">Coming Soon</h1>
        <p className="text-gray-500 mb-6">Dashboard is under construction</p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-black text-white rounded-full hover:shadow-lg transition-all font-medium flex items-center gap-2 mx-auto"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
