import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AnimatedTitle } from '../components/AnimatedTitle';
import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react';

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
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f4] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cpath d=\\"M0 0h60v60H0z\\" fill=\\"none\\"/%3E%3Cpath d=\\"M0 0h1v1H0zM30 30h1v1h-1z\\" fill=\\"%23000\\"/%3E%3C/svg%3E")' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <h1 className="text-[28px] tracking-tight text-[#1a1a1a]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <AnimatedTitle />
        </h1>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleLogout}
        className="absolute top-8 right-8 z-20 px-4 py-2 rounded-full bg-white border border-black/10 text-sm font-medium hover:bg-[#fafaf9] transition-all flex items-center gap-2"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <LogOut className="w-4 h-4" />
        Logout
      </motion.button>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-[48px] font-bold text-[#1a1a1a] mb-4 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Welcome to ScribbleX! 🎨
            </h2>
            <p className="text-[18px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your creative canvas awaits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5"
          >
            <div className="flex items-center gap-6 mb-8">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-[18px] object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-[18px] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-lg">
                  <User className="w-12 h-12 text-indigo-400" />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-semibold text-[#1a1a1a] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {user?.name || 'User'}
                </h3>
                <p className="text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  @{user?.username || 'username'}
                </p>
                {user?.location && (
                  <p className="text-sm text-[#999999] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    📍 {user.location}
                  </p>
                )}
              </div>
            </div>

            {user?.bio && (
              <div className="p-4 bg-[#fafaf9] rounded-[12px] border border-black/5 mb-6">
                <p className="text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  "{user.bio}"
                </p>
              </div>
            )}

            <div className="text-center py-12">
              <p className="text-[#999999] text-lg mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Dashboard coming soon...
              </p>
              <p className="text-[#999999] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                We're building something amazing for you! 🚀
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
