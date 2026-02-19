import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <nav className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">ScribbleX</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {user?.name || user?.username}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white border border-black/10 text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ScribbleX
          </h2>
          <p className="text-lg text-gray-600">
            Your collaborative thinking canvas
          </p>
        </motion.div>
      </main>
    </div>
  );
}
