import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Trash2, Pen, Hand, Eraser, Check, MousePointer2, Redo, Undo } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCRDT, Node } from '../hooks/useCRDT';
import { useDrawing } from '../hooks/useDrawing';
import { InfiniteCanvas } from '../components/InfiniteCanvas';

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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

    newSocket.on('error', (error: { message: string }) => {
      toast.error(error.message);
    });

    // Room events
    newSocket.on('room:users', (currentUsers: RoomUser[]) => {
      setUsers(currentUsers);
    });

    newSocket.on('room:user-joined', (user: RoomUser) => {
      setUsers((prev) => [...prev, user]);
      toast.success(`${user.name} joined`);
    });

    newSocket.on('room:user-left', ({ userId }: { userId: string }) => {
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

  // Cursor logic - placeholder for Konva implementation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disabled legacy cursor tracking
  };

  const colors = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return <div className="p-8 text-center text-red-500">Error: Room data is missing. ID: {id}</div>;
  }

  return (
    <div className="fixed inset-0 bg-[#fafaf9] overflow-hidden">
      {/* Canvas Layer - Full Screen */}
      <div className="absolute inset-0 z-0">
        <InfiniteCanvas
          strokes={drawing.strokes as any}
          currentStroke={drawing.currentStroke as any}
          onStrokeStart={drawing.startDrawing}
          onStrokeMove={drawing.continueDrawing}
          onStrokeEnd={drawing.endDrawing}
          enabled={tool === 'pen'}
          color={drawing.color}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 pointer-events-none h-full w-full">

        {/* Top Header Floating */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto"
        >
          {/* Room Info & Back */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition-all border border-black/5 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:bg-black group-hover:text-white rounded-full transition-colors" />
            </button>
            <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-black/5 flex flex-col justify-center">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">{room.title}</h1>
              {room.description && <p className="text-[10px] text-gray-500 leading-tight">{room.description}</p>}
            </div>
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-2 items-end">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-sm border border-black/5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
              <span className="text-xs font-semibold text-gray-600">{users.length} active</span>
            </div>

            {/* Avatar Stack */}
            <div className="flex -space-x-2 flex-row-reverse">
              {users.slice(0, 5).map((u) => (
                <div key={u.userId} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold shadow-sm" title={u.name}>
                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full" /> : u.name[0]}
                </div>
              ))}
              {users.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                  +{users.length - 5}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom Toolbar Floating */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 scale-100 origin-bottom">
            {/* Main Tools */}
            <div className="flex p-1 bg-gray-100/50 rounded-xl gap-1">
              <Tooltip text="Select (V)">
                <button
                  onClick={() => setTool('select')}
                  className={`p-3 rounded-lg transition-all ${tool === 'select' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                >
                  <MousePointer2 className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Pen (P)">
                <button
                  onClick={() => setTool('pen')}
                  className={`p-3 rounded-lg transition-all ${tool === 'pen' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                >
                  <Pen className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            <div className="w-px h-8 bg-gray-200 mx-1" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Tooltip text="Undo (Ctrl+Z)">
                <button onClick={undo} disabled={!canUndo} className="p-3 rounded-lg text-gray-500 hover:bg-gray-100/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Undo className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Redo (Ctrl+Y)">
                <button onClick={redo} disabled={!canRedo} className="p-3 rounded-lg text-gray-500 hover:bg-gray-100/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Redo className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Pen Controls (Only when Pen is active) */}
            <AnimatePresence>
              {tool === 'pen' && (
                <motion.div
                  initial={{ width: 0, opacity: 0, scale: 0.9 }}
                  animate={{ width: 'auto', opacity: 1, scale: 1 }}
                  exit={{ width: 0, opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 overflow-hidden ml-1 pl-2 border-l border-gray-200"
                >
                  <div className="flex gap-1.5">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => drawing.setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${drawing.color === c ? 'border-black scale-110 shadow-sm' : 'border-black/5'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={drawing.width}
                    onChange={(e) => drawing.setWidth(Number(e.target.value))}
                    className="w-16 accent-black"
                    title="Stroke Width"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Helper Hint */}
        {drawing.strokes.length === 0 && tool === 'select' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Pen className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-xl font-medium text-gray-900">Start Creating</p>
            <p className="text-sm text-gray-500 mt-1">Select the Pen tool (P) to draw</p>
          </div>
        )}

      </div>

      {/* Cursors Layer */}
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
            zIndex: 50,
          }}
        >
          {/* Cursor SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: 'translate(-2px, -2px)' }}>
            <path d="M5.65376 12.3673L8.97017 15.6837L15.6837 8.97017L12.3673 5.65376L5.65376 12.3673Z" fill={cursor.color} stroke="white" strokeWidth="1.5" />
            <path d="M12.3673 5.65376L15.6837 8.97017L8.97017 15.6837L5.65376 12.3673L12.3673 5.65376Z" fill={cursor.color} />
          </svg>
          <div className="mt-1 px-2 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-sm" style={{ backgroundColor: cursor.color }}>
            {cursor.name}
          </div>
        </motion.div>
      ))}

      {/* Nodes (CRDT) - temporarily hidden until coordinate system is unified */}
      {nodes.map((node) => (
        <div key={node.id} className="hidden" />
      ))}
    </div>
  );
}

// Simple Tooltip Helper
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <div className="group relative flex justify-center">
    {children}
    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {text}
    </div>
  </div>
);
