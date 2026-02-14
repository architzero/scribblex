import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users, Plus, Trash2, Pen, Hand, Palette, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCRDT, Node } from '../hooks/useCRDT';
import { useDrawing } from '../hooks/useDrawing';
import DrawingCanvas from '../components/DrawingCanvas';

interface RoomUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: Date;
  color?: string;
}

interface Cursor {
  userId: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

interface Room {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [canvasRef, setCanvasRef] = useState<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<'select' | 'pen'>('select');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { nodes, addNode, updateNode, deleteNode, undo, redo, canUndo, canRedo } = useCRDT(socket, id || '');
  const drawing = useDrawing(socket, id || '');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setTool('select');
      } else if (e.key === 'p' || e.key === 'P') {
        setTool('pen');
      } else if (e.key === 'Escape') {
        setTool('select');
        setShowColorPicker(false);
      }
      // Undo/Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        toast.success('Undo');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        toast.success('Redo');
      }
      // Delete
      else if ((e.key === 'Delete' || e.key === 'Backspace') && dragging === null) {
        // Delete selected node if any
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, dragging]);

  useEffect(() => {
    if (!id) return;

    // Fetch room details
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${id}`);
        setRoom(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load room');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !room) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }

    // Initialize Socket.IO with reconnection
    const newSocket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
      setConnected(true);
      newSocket.emit('room:join', id);
      toast.success('Connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO:', reason);
      setConnected(false);
      toast.error('Disconnected');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      toast.success('Reconnected');
      newSocket.emit('room:join', id);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('error', (error: { message: string }) => {
      toast.error(error.message);
    });

    // Room events
    newSocket.on('room:users', (currentUsers: RoomUser[]) => {
      console.log('👥 Current users:', currentUsers);
      setUsers(currentUsers);
    });

    newSocket.on('room:user-joined', (user: RoomUser) => {
      console.log('👋 User joined:', user);
      setUsers((prev) => [...prev, user]);
      toast.success(`${user.name} joined the room`);
    });

    newSocket.on('room:user-left', ({ userId }: { userId: string }) => {
      console.log('👋 User left:', userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      setCursors((prev) => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Cursor events
    newSocket.on('cursor:move', ({ userId, name, x, y, color }: Cursor) => {
      setCursors((prev) => {
        const updated = new Map(prev);
        updated.set(userId, { userId, name, x, y, color });
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('room:leave', id);
      newSocket.disconnect();
    };
  }, [id, room, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        setTool('select');
      } else if (e.key === 'p' || e.key === 'P') {
        setTool('pen');
      } else if (e.key === 'Escape') {
        setTool('select');
        setShowColorPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mouse move for cursor tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!socket || !connected || !canvasRef || tool === 'pen') return;
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('cursor:move', {
      roomId: id,
      x,
      y,
      name: user.name || 'Anonymous',
      color: user.color || '#000000',
    });
  };

  const colors = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="border-b border-black/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{room.title}</h1>
              {room.description && (
                <p className="text-sm text-gray-600">{room.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tool Selector */}
            <div className="flex bg-white rounded-full border border-black/10 p-1 gap-1">
              <button
                onClick={() => setTool('select')}
                className={`p-2 rounded-full transition-all ${tool === 'select' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Select Tool (V)"
              >
                <Hand className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-full transition-all ${tool === 'pen' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Pen Tool (P)"
              >
                <Pen className="w-4 h-4" />
              </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex bg-white rounded-full border border-black/10 p-1 gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            {/* Drawing Controls */}
            {tool === 'pen' && (
              <div className="flex items-center gap-2 bg-white rounded-full border border-black/10 px-3 py-2">
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-6 h-6 rounded-full border-2 border-black/20"
                    style={{ backgroundColor: drawing.color }}
                  />
                  {showColorPicker && (
                    <div className="absolute top-10 left-0 bg-white rounded-xl shadow-lg border border-black/10 p-2 flex gap-2 z-50">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            drawing.setColor(c);
                            setShowColorPicker(false);
                          }}
                          className="w-8 h-8 rounded-full border-2 border-black/20 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={drawing.width}
                  onChange={(e) => drawing.setWidth(Number(e.target.value))}
                  className="w-20"
                />
                <button
                  onClick={drawing.clearCanvas}
                  className="p-1 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear Canvas"
                >
                  <Eraser className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* User Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{users.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Canvas Area */}
          <div 
            ref={setCanvasRef}
            onMouseMove={handleMouseMove}
            className="col-span-3 bg-white border-2 border-black rounded-2xl p-8 min-h-[600px] relative overflow-hidden"
            style={{ cursor: tool === 'pen' ? 'crosshair' : 'default' }}
          >
            {/* Drawing Canvas Layer */}
            <DrawingCanvas
              strokes={drawing.strokes}
              currentStroke={drawing.currentStroke}
              isDrawing={drawing.isDrawing}
              onMouseDown={drawing.startDrawing}
              onMouseMove={drawing.continueDrawing}
              onMouseUp={drawing.endDrawing}
              enabled={tool === 'pen'}
            />
            {/* Add Node Button */}
            <button
              onClick={() => {
                if (!socket || !connected) {
                  toast.error('Not connected to server');
                  return;
                }
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const colors = ['#FFE66D', '#FF6B6B', '#4ECDC4', '#A8E6CF', '#C7CEEA', '#FFB6C1'];
                const newNode: Node = {
                  id: `node-${Date.now()}-${Math.random()}`,
                  content: 'New Note',
                  x: Math.random() * 400 + 50,
                  y: Math.random() * 300 + 50,
                  color: colors[Math.floor(Math.random() * colors.length)],
                  width: 200,
                  height: 100,
                  createdBy: user.id || 'unknown',
                  createdAt: Date.now(),
                };
                console.log('Adding node:', newNode);
                addNode(newNode);
                toast.success('Node added!');
              }}
              disabled={tool === 'pen'}
              className="absolute top-4 right-4 px-4 py-2 bg-black text-white rounded-full hover:shadow-lg transition-all flex items-center gap-2 text-sm font-medium z-20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>

            {/* Nodes */}
            {tool === 'select' && nodes.map((node) => (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                onDragStart={() => setDragging(node.id)}
                onDragEnd={(_, info) => {
                  setDragging(null);
                  updateNode(node.id, {
                    x: node.x + info.offset.x,
                    y: node.y + info.offset.y,
                  });
                }}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  cursor: dragging === node.id ? 'grabbing' : 'grab',
                  zIndex: 100,
                  width: node.width || 200,
                  minHeight: node.height || 100,
                  backgroundColor: node.color || '#ffffff',
                }}
                className="border-2 border-black rounded-lg p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <textarea
                    value={node.content}
                    onChange={(e) => updateNode(node.id, { content: e.target.value })}
                    className="flex-1 text-sm font-medium bg-transparent border-none outline-none resize-none"
                    onClick={(e) => e.stopPropagation()}
                    rows={3}
                    style={{ color: node.color === '#000000' || !node.color ? '#000' : '#fff' }}
                  />
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={node.color || '#ffffff'}
                      onChange={(e) => updateNode(node.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      title="Change color"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(node.createdAt).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-lg mb-2">Click "Add Node" to start</p>
                  <p className="text-sm">Drag nodes to move them around</p>
                </div>
              </div>
            )}

            {/* Live Cursors */}
            {Array.from(cursors.values()).map((cursor) => (
              <motion.div
                key={cursor.userId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'absolute',
                  left: cursor.x,
                  top: cursor.y,
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: 'translate(-2px, -2px)' }}
                >
                  <path
                    d="M5.65376 12.3673L8.97017 15.6837L15.6837 8.97017L12.3673 5.65376L5.65376 12.3673Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12.3673 5.65376L15.6837 8.97017L8.97017 15.6837L5.65376 12.3673L12.3673 5.65376Z"
                    fill={cursor.color}
                  />
                </svg>
                <div
                  className="mt-1 px-2 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Participants Panel */}
          <div className="bg-white border-2 border-black rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({users.length})
            </h3>

            <div className="space-y-3">
              <AnimatePresence>
                {users.map((user) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.userId === room.creator.id ? 'Host' : 'Participant'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {users.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No one here yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
