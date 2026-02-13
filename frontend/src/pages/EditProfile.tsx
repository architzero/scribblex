import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.put('/user/profile', { name, bio, location });
      
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      
      toast.success('Profile updated!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[#666666] hover:text-[#1a1a1a] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-black/5"
        >
          <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#ff6392]/20 focus:border-[#ff6392] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#ff6392]/20 focus:border-[#ff6392] transition-all resize-none"
              />
              <div className="text-right text-xs text-[#999999] mt-1">{bio.length}/160</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#ff6392]/20 focus:border-[#ff6392] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] disabled:opacity-40 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
