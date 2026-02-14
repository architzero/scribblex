import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3x3, List, Lock, Globe, Users, Trash2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Canvases</h1>
            <p className="text-gray-500 mt-1">{rooms.length} {rooms.length === 1 ? 'canvas' : 'canvases'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-full border border-black/10 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-full hover:shadow-lg transition-all flex items-center gap-2 font-medium"
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
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No canvases yet</h3>
            <p className="text-gray-500 mb-6">Create your first canvas to start collaborating</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Canvas
            </button>
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-black/10 overflow-hidden hover:shadow-xl transition-all cursor-pointer group relative"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {room.thumbnail ? (
                    <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Grid3x3 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                      {room.visibility === 'PRIVATE' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {room.visibility}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg truncate flex-1">{room.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoom(room.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  {room.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{room.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room._count.participants}
                    </div>
                    <div>{new Date(room.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && rooms.length > 0 && (
          <div className="space-y-3">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-black/10 p-4 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div className="w-24 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0">
                  {room.thumbnail ? (
                    <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Grid3x3 className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{room.title}</h3>
                  {room.description && (
                    <p className="text-sm text-gray-500 truncate">{room.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    {room.visibility === 'PRIVATE' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {room.visibility}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room._count.participants}
                  </div>
                  <div>{new Date(room.updatedAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRoom(room.id);
                  }}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Canvas</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newRoom.title}
                    onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                    placeholder="My Awesome Canvas"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What's this canvas about?"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewRoom({ ...newRoom, visibility: 'PUBLIC' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                        newRoom.visibility === 'PUBLIC'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Public
                    </button>
                    <button
                      onClick={() => setNewRoom({ ...newRoom, visibility: 'PRIVATE' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                        newRoom.visibility === 'PRIVATE'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Private
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-black/10 rounded-full hover:border-black/20 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoom.title.trim() || createLoading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
