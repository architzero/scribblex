import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3x3, List, Lock, Globe, Users, Trash2, Search, Zap, LayoutGrid } from 'lucide-react';
import api from '../lib/api';

interface Room {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  _count: {
    participants: number;
  };
}

export default function Home() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({ title: '', description: '', visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoom.title.trim()) return;
    setCreateLoading(true);
    try {
      const { data } = await api.post('/rooms', newRoom);
      setRooms([data, ...rooms]);
      setShowCreateModal(false);
      setNewRoom({ title: '', description: '', visibility: 'PUBLIC' });
      navigate(`/room/${data.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Delete this canvas? This cannot be undone.')) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-400">Loading your space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">My Canvases</h1>
            <p className="text-gray-500 font-medium">Create, collaborate, and share your ideas.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-white rounded-xl border border-black/5 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-black text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 font-semibold tracking-wide"
            >
              <Plus className="w-5 h-5" />
              New Canvas
            </button>
          </div>
        </div>

        {/* Empty State */}
        {rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <Zap className="w-10 h-10 text-gray-300 fill-current" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No canvases yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Your space is empty. Create your first infinite canvas to start brainstorming and collaborating.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-black text-white rounded-full hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create First Canvas
            </button>
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, scale: 1.01 }}
                className="bg-white rounded-3xl border border-black/5 overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                {/* Thumbnail Area */}
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-200/50 relative overflow-hidden group-hover:bg-gray-100/50 transition-colors">
                  {room.thumbnail ? (
                    <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <LayoutGrid className="w-16 h-16 opacity-50" />
                    </div>
                  )}

                  {/* Floating Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold shadow-sm border border-black/5 flex items-center gap-1.5 text-gray-700">
                      {room.visibility === 'PRIVATE' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {room.visibility}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-xl truncate pr-4 group-hover:text-blue-600 transition-colors">{room.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoom(room.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 -mr-2"
                      title="Delete Canvas"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  {room.description ? (
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">{room.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 mb-6 italic flex-1">No description</p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5" />
                      {room._count.participants} participants
                    </div>
                    <div className="text-xs font-medium text-gray-400">
                      Edited {new Date(room.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && rooms.length > 0 && (
          <div className="space-y-4">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-black/5 p-4 hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer flex items-center gap-6 group"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div className="w-32 h-20 bg-gradient-to-br from-gray-50 to-gray-200/50 rounded-xl flex-shrink-0 flex items-center justify-center">
                  {room.thumbnail ? (
                    <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <LayoutGrid className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate mb-1 group-hover:text-blue-600 transition-colors">{room.title}</h3>
                  {room.description && (
                    <p className="text-sm text-gray-500 truncate">{room.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-8 text-sm text-gray-500 mr-4">
                  <div className="flex items-center gap-1.5">
                    {room.visibility === 'PRIVATE' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    <span className="font-medium">{room.visibility}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{room._count.participants}</span>
                  </div>
                  <div className="font-mono text-xs">
                    {new Date(room.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRoom(room.id);
                  }}
                  className="p-3 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">New Canvas</h2>
              <p className="text-gray-500 mb-8">Set up your workspace for collaboration.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Title</label>
                  <input
                    type="text"
                    value={newRoom.title}
                    onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                    placeholder="e.g. Q4 Strategy Brainstorm"
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black focus:outline-none transition-all font-medium text-lg placeholder:text-gray-300"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What's the goal of this session?"
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black focus:outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Visibility</label>
                  <div className="flex gap-4 p-1 bg-gray-100/50 rounded-2xl">
                    <button
                      onClick={() => setNewRoom({ ...newRoom, visibility: 'PUBLIC' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${newRoom.visibility === 'PUBLIC'
                          ? 'bg-white border-black/5 shadow-md'
                          : 'border-transparent hover:bg-gray-100 text-gray-500'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <Globe className="w-4 h-4" />
                        Public
                      </div>
                      <span className="text-[10px] opacity-70">Anyone can join</span>
                    </button>
                    <button
                      onClick={() => setNewRoom({ ...newRoom, visibility: 'PRIVATE' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${newRoom.visibility === 'PRIVATE'
                          ? 'bg-white border-black/5 shadow-md'
                          : 'border-transparent hover:bg-gray-100 text-gray-500'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <Lock className="w-4 h-4" />
                        Private
                      </div>
                      <span className="text-[10px] opacity-70">Invite only</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoom.title.trim() || createLoading}
                  className="flex-1 px-6 py-4 bg-black text-white rounded-xl hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all font-bold flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Create Canvas <ArrowLeft className="w-4 h-4 rotate-180" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
