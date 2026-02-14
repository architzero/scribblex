import { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import prisma from "../prisma";
import { crdtManager } from "../services/crdt.service";
import { Node, NodeUpdate } from "../types/crdt.types";
import * as Y from 'yjs';

interface RoomUser {
  userId: string;
  socketId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: Date;
}

interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  createdBy: string;
  createdAt: number;
}

const roomUsers = new Map<string, Map<string, RoomUser>>();
const roomDrawings = new Map<string, DrawingStroke[]>();
const drawingSaveTimers = new Map<string, NodeJS.Timeout>();

function scheduleDrawingSave(roomId: string) {
  if (drawingSaveTimers.has(roomId)) {
    clearTimeout(drawingSaveTimers.get(roomId)!);
  }
  const timer = setTimeout(async () => {
    const strokes = roomDrawings.get(roomId) || [];
    try {
      await prisma.room.update({
        where: { id: roomId },
        data: { drawingState: strokes },
      });
      console.log(`💾 Saved ${strokes.length} drawing strokes for room ${roomId}`);
    } catch (error) {
      console.error('Failed to save drawing state:', error);
    }
    drawingSaveTimers.delete(roomId);
  }, 2000);
  drawingSaveTimers.set(roomId, timer);
}

export async function registerWebsocket(app: FastifyInstance) {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
      
      // Fetch user details
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`✅ User connected: ${user.name} (${user.id})`);

    // Join room
    socket.on('room:join', async (roomId: string) => {
      try {
        // Verify user has access to room
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            participants: {
              where: { userId: user.id },
            },
          },
        });

        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is participant or room is public
        const isParticipant = room.participants.length > 0;
        if (room.visibility === 'PRIVATE' && !isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Initialize CRDT document for room (loads from DB if exists)
        await crdtManager.getOrCreateRoom(roomId);

        // Join socket room
        socket.join(roomId);
        socket.data.currentRoom = roomId;

        // Initialize room users map if not exists
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }

        const roomUserMap = roomUsers.get(roomId)!;
        
        // Add user to room
        roomUserMap.set(user.id, {
          userId: user.id,
          socketId: socket.id,
          name: user.name || user.email,
          avatarUrl: user.avatarUrl || undefined,
          joinedAt: new Date(),
        });

        // Get current users in room
        const currentUsers = Array.from(roomUserMap.values());

        // Notify user of current participants
        socket.emit('room:users', currentUsers);

        // Notify others that user joined
        socket.to(roomId).emit('room:user-joined', {
          userId: user.id,
          name: user.name || user.email,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date(),
        });

        // Send CRDT state to new user
        const state = crdtManager.getState(roomId);
        socket.emit('crdt:sync', Array.from(state));

        // Send drawing state to new user (load from DB)
        const roomData = await prisma.room.findUnique({
          where: { id: roomId },
          select: { drawingState: true },
        });
        const drawings = (roomData?.drawingState as DrawingStroke[]) || [];
        roomDrawings.set(roomId, drawings);
        socket.emit('drawing:sync', drawings);

        console.log(`👤 ${user.name} joined room ${roomId}. Total users: ${currentUsers.length}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('room:leave', (roomId: string) => {
      handleUserLeave(socket, roomId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const roomId = socket.data.currentRoom;
      if (roomId) {
        handleUserLeave(socket, roomId);
      }
      console.log(`❌ User disconnected: ${user.name} (${user.id})`);
    });

    // Typing indicator
    socket.on('room:typing', (roomId: string) => {
      socket.to(roomId).emit('room:user-typing', {
        userId: user.id,
        name: user.name || user.email,
      });
    });

    // Stop typing
    socket.on('room:stop-typing', (roomId: string) => {
      socket.to(roomId).emit('room:user-stop-typing', {
        userId: user.id,
      });
    });

    // CRDT: Add node
    socket.on('node:add', (data: { roomId: string; node: Node }) => {
      const { roomId, node } = data;
      if (socket.data.currentRoom !== roomId) return;

      crdtManager.addNode(roomId, node);
      socket.to(roomId).emit('node:added', node);
    });

    // CRDT: Update node
    socket.on('node:update', (data: { roomId: string; update: NodeUpdate }) => {
      const { roomId, update } = data;
      if (socket.data.currentRoom !== roomId) return;

      crdtManager.updateNode(roomId, update.id, update);
      socket.to(roomId).emit('node:updated', update);
    });

    // CRDT: Delete node
    socket.on('node:delete', (data: { roomId: string; nodeId: string }) => {
      const { roomId, nodeId } = data;
      if (socket.data.currentRoom !== roomId) return;

      crdtManager.deleteNode(roomId, nodeId);
      socket.to(roomId).emit('node:deleted', { nodeId });
    });

    // CRDT: Sync update
    socket.on('crdt:update', (data: { roomId: string; update: number[] }) => {
      const { roomId, update } = data;
      if (socket.data.currentRoom !== roomId) return;

      const updateArray = new Uint8Array(update);
      crdtManager.applyUpdate(roomId, updateArray);
      socket.to(roomId).emit('crdt:update', update);
    });

    // Cursor: Move
    socket.on('cursor:move', (data: { roomId: string; x: number; y: number; name: string; color: string }) => {
      const { roomId, x, y, name, color } = data;
      if (socket.data.currentRoom !== roomId) return;

      socket.to(roomId).emit('cursor:move', {
        userId: user.id,
        name,
        x,
        y,
        color,
      });
    });

    // Drawing: Stroke
    socket.on('drawing:stroke', (data: { roomId: string; stroke: DrawingStroke }) => {
      const { roomId, stroke } = data;
      if (socket.data.currentRoom !== roomId) return;

      // Store stroke
      if (!roomDrawings.has(roomId)) {
        roomDrawings.set(roomId, []);
      }
      roomDrawings.get(roomId)!.push(stroke);

      // Schedule save to DB
      scheduleDrawingSave(roomId);

      // Broadcast to others
      socket.to(roomId).emit('drawing:stroke', stroke);
    });

    // Drawing: Clear
    socket.on('drawing:clear', (data: { roomId: string }) => {
      const { roomId } = data;
      if (socket.data.currentRoom !== roomId) return;

      // Clear drawings
      roomDrawings.set(roomId, []);

      // Save to DB immediately
      prisma.room.update({
        where: { id: roomId },
        data: { drawingState: [] },
      }).catch(err => console.error('Failed to clear drawing state:', err));

      // Broadcast to others
      socket.to(roomId).emit('drawing:clear');
    });
  });

  function handleUserLeave(socket: any, roomId: string) {
    const user = socket.data.user;
    const roomUserMap = roomUsers.get(roomId);

    if (roomUserMap) {
      roomUserMap.delete(user.id);

      // Clean up empty rooms
      if (roomUserMap.size === 0) {
        roomUsers.delete(roomId);
      }

      // Notify others
      socket.to(roomId).emit('room:user-left', {
        userId: user.id,
      });

      console.log(`👋 ${user.name} left room ${roomId}. Remaining: ${roomUserMap.size}`);
    }

    socket.leave(roomId);
    socket.data.currentRoom = null;
  }

  // Expose io instance for use in routes if needed
  app.decorate('io', io);

  console.log('🔌 Socket.IO initialized');
}

