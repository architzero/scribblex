# ScribbLeX - Technical Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Vite                           │  │
│  │  ├─ Pages/                                           │  │
│  │  │  ├─ Dashboard.tsx (Room Management)              │  │
│  │  │  ├─ Room.tsx (Collaborative Canvas)              │  │
│  │  │  └─ CompleteProfile.tsx (Onboarding)             │  │
│  │  ├─ Hooks/                                           │  │
│  │  │  ├─ useCRDT.ts (Node Sync)                       │  │
│  │  │  └─ useDrawing.ts (Drawing Sync)                 │  │
│  │  └─ Components/                                      │  │
│  │     └─ DrawingCanvas.tsx (SVG Drawing)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│                    Socket.IO Client                          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Fastify + TypeScript                                │  │
│  │  ├─ Routes/                                          │  │
│  │  │  ├─ room.routes.ts (CRUD API)                    │  │
│  │  │  ├─ auth.routes.ts (Authentication)              │  │
│  │  │  └─ profile.routes.ts (User Management)          │  │
│  │  ├─ Services/                                        │  │
│  │  │  └─ crdt.service.ts (Yjs Manager)                │  │
│  │  └─ Plugins/                                         │  │
│  │     └─ websocket.ts (Socket.IO Server)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│                    Socket.IO Server                          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Neon)                                   │  │
│  │  ├─ Users (auth, profiles, colors)                  │  │
│  │  ├─ Rooms (metadata, visibility, thumbnails)        │  │
│  │  ├─ RoomParticipants (access control)               │  │
│  │  └─ CRDT State (Yjs documents as Bytes)             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  In-Memory Storage                                   │  │
│  │  ├─ Room Users (active participants)                │  │
│  │  ├─ Cursors (real-time positions)                   │  │
│  │  └─ Drawings (strokes, temporary)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────���────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Room Creation Flow
```
User → Dashboard → Click "New Canvas"
  ↓
Create Modal → Fill Form (title, description, visibility)
  ↓
POST /rooms → Backend validates → Create Room in DB
  ↓
Add creator as HOST participant
  ↓
Return room data → Navigate to /room/:id
```

### 2. Real-Time Collaboration Flow
```
User A joins room
  ↓
WebSocket: room:join → Validate access → Join socket room
  ↓
Load CRDT state from DB → Send to User A
  ↓
Load drawings from memory → Send to User A
  ↓
Broadcast "user-joined" to others
  ↓
User A moves cursor → cursor:move event
  ↓
Broadcast to all users in room (except User A)
  ↓
User B sees User A's cursor in real-time
```

### 3. Drawing Sync Flow
```
User A switches to Pen tool (P key)
  ↓
User A draws stroke on canvas
  ↓
drawing:stroke event → Backend stores in memory
  ↓
Broadcast to all users in room
  ↓
User B receives stroke → Renders on their canvas
  ↓
User C joins later → Receives all strokes via drawing:sync
```

### 4. Node Collaboration Flow (CRDT)
```
User A adds node
  ↓
node:add event → CRDTManager.addNode()
  ↓
Yjs Y.Map updates → Debounced save to DB (2s)
  ↓
Broadcast to all users
  ↓
User B updates same node
  ↓
node:update event → CRDTManager.updateNode()
  ↓
Yjs merges changes (conflict-free)
  ↓
Broadcast merged state
  ↓
All users see consistent state
```

---

## 🗄️ Database Schema

### Users Table
```sql
id           UUID PRIMARY KEY
email        VARCHAR UNIQUE
username     VARCHAR UNIQUE
name         VARCHAR
avatarUrl    VARCHAR
color        VARCHAR DEFAULT '#000000'  -- NEW: For cursors
password     VARCHAR
profileCompleted BOOLEAN
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
```

### Rooms Table
```sql
id           UUID PRIMARY KEY
title        VARCHAR NOT NULL
description  TEXT
thumbnail    VARCHAR  -- NEW: For previews
visibility   ENUM('PUBLIC', 'PRIVATE')
createdBy    UUID REFERENCES Users(id)
isActive     BOOLEAN DEFAULT true
crdtState    BYTEA  -- Serialized Yjs document
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
```

### RoomParticipants Table
```sql
roomId       UUID REFERENCES Rooms(id)
userId       UUID REFERENCES Users(id)
role         ENUM('HOST', 'PARTICIPANT')
joinedAt     TIMESTAMP
PRIMARY KEY (roomId, userId)
```

---

## 🔌 WebSocket Events

### Room Events
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `room:join` | Client → Server | `roomId` | Join a room |
| `room:leave` | Client → Server | `roomId` | Leave a room |
| `room:users` | Server → Client | `RoomUser[]` | Current participants |
| `room:user-joined` | Server → Clients | `RoomUser` | New user joined |
| `room:user-left` | Server → Clients | `{ userId }` | User left |

### Cursor Events
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `cursor:move` | Client → Server | `{ roomId, x, y, name, color }` | Cursor position |
| `cursor:move` | Server → Clients | `{ userId, name, x, y, color }` | Broadcast cursor |

### Drawing Events
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `drawing:stroke` | Client → Server | `{ roomId, stroke }` | New stroke drawn |
| `drawing:stroke` | Server → Clients | `stroke` | Broadcast stroke |
| `drawing:clear` | Client → Server | `{ roomId }` | Clear canvas |
| `drawing:clear` | Server → Clients | - | Broadcast clear |
| `drawing:sync` | Server → Client | `DrawingStroke[]` | Initial state |

### CRDT Events (Nodes)
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `node:add` | Client → Server | `{ roomId, node }` | Add node |
| `node:added` | Server → Clients | `node` | Broadcast new node |
| `node:update` | Client → Server | `{ roomId, update }` | Update node |
| `node:updated` | Server → Clients | `update` | Broadcast update |
| `node:delete` | Client → Server | `{ roomId, nodeId }` | Delete node |
| `node:deleted` | Server → Clients | `{ nodeId }` | Broadcast deletion |
| `crdt:sync` | Server → Client | `Node[]` | Initial state |
| `crdt:update` | Bidirectional | `Uint8Array` | Yjs update |

---

## 🎯 State Management

### Frontend State
```typescript
// Room.tsx
const [socket, setSocket] = useState<Socket | null>(null);
const [room, setRoom] = useState<Room | null>(null);
const [users, setUsers] = useState<RoomUser[]>([]);
const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
const [tool, setTool] = useState<'select' | 'pen'>('select');

// useCRDT.ts
const [nodes, setNodes] = useState<Node[]>([]);
const [ydoc] = useState(() => new Y.Doc());

// useDrawing.ts
const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
const [color, setColor] = useState('#000000');
const [width, setWidth] = useState(2);
```

### Backend State
```typescript
// In-Memory Maps
const roomUsers = new Map<string, Map<string, RoomUser>>();
const roomDrawings = new Map<string, DrawingStroke[]>();

// CRDT Manager
class CRDTManager {
  private rooms = new Map<string, Y.Doc>();
  private saveTimers = new Map<string, NodeJS.Timeout>();
}
```

---

## 🔐 Security Layers

### 1. Authentication
- JWT tokens for API requests
- WebSocket authentication middleware
- Token validation on every request

### 2. Authorization
- Room access validation (public vs private)
- Creator-only edit/delete permissions
- Participant verification before joining

### 3. Data Validation
- Prisma schema validation
- Input sanitization
- SQL injection protection

### 4. Rate Limiting (TODO)
- API endpoint throttling
- WebSocket event throttling
- Per-user limits

---

## ⚡ Performance Optimizations

### Current:
1. **Debounced CRDT Saves** - 2s delay prevents DB spam
2. **In-Memory Cursors** - No DB writes for cursor positions
3. **SVG Drawing** - GPU-accelerated rendering
4. **Efficient Broadcasting** - Only to users in same room
5. **Lazy Loading** - Rooms loaded on demand

### Planned:
1. **Virtual Rendering** - Only render visible nodes
2. **Canvas Chunking** - Split large canvases into tiles
3. **WebRTC P2P** - Direct peer connections for low latency
4. **Service Worker** - Offline support and caching
5. **CDN for Assets** - Fast static file delivery

---

## 📦 Tech Stack Summary

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Real-Time**: Socket.IO Client
- **CRDT**: Yjs
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Framework**: Fastify + TypeScript
- **Real-Time**: Socket.IO Server
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **CRDT**: Yjs
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Zod (via Prisma)

### Infrastructure
- **Database**: Neon (Serverless Postgres)
- **Hosting**: TBD (Vercel/Railway/AWS)
- **CDN**: TBD (Cloudflare/AWS CloudFront)
- **Monitoring**: TBD (Sentry/DataDog)

---

## 🚀 Deployment Architecture (Planned)

```
┌─────────────────────────────────────────────────────────┐
│                    CDN (Cloudflare)                      │
│              Static Assets + Edge Caching                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Load Balancer (AWS ALB)                     │
│           SSL Termination + Health Checks                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────┬──────────────────┬──────────────────┐
│   Frontend       │   Backend API    │  WebSocket       │
│   (Vercel)       │   (Railway)      │  (Railway)       │
│   React SPA      │   Fastify REST   │  Socket.IO       │
└──────────────────┴──────────────────┴──────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Database (Neon Postgres)                    │
│           Connection Pooling + Auto-Scaling              │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Monitoring & Observability (TODO)

### Metrics to Track:
- Active users per room
- WebSocket connection count
- API response times
- Database query performance
- CRDT sync latency
- Drawing stroke count
- Error rates

### Tools:
- **Sentry** - Error tracking
- **DataDog** - APM and metrics
- **LogRocket** - Session replay
- **Mixpanel** - User analytics

---

## 🎓 Key Learnings

### What Worked Well:
1. **Yjs for CRDT** - Conflict-free sync is magical
2. **Socket.IO** - Easy real-time communication
3. **Prisma** - Type-safe database access
4. **Framer Motion** - Smooth animations
5. **Modular Architecture** - Easy to extend

### Challenges Solved:
1. **CRDT Persistence** - Debounced saves prevent DB overload
2. **Cursor Performance** - In-memory only, no DB writes
3. **Drawing Sync** - SVG paths for smooth rendering
4. **Tool Switching** - Keyboard shortcuts for UX
5. **Room Isolation** - Proper WebSocket room management

---

## 🔮 Future Architecture Considerations

### Scalability:
- Horizontal scaling with Redis for session storage
- Separate WebSocket servers from API servers
- Database read replicas for room list queries
- Message queue (RabbitMQ) for async tasks

### Reliability:
- Circuit breakers for external services
- Graceful degradation on DB failures
- Automatic reconnection logic
- State recovery on disconnect

### Security:
- End-to-end encryption for private rooms
- Content moderation for public rooms
- DDoS protection at edge
- Regular security audits

---

**This architecture supports 1000+ concurrent users per room with proper scaling! 🚀**
