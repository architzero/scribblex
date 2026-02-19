# ScribbleX

AI-powered collaborative thinking canvas that transforms chaotic brainstorming into structured collective intelligence.

## Quick Start

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Setup

**Backend `.env`:**
```env
DATABASE_URL="your_postgres_url"
JWT_SECRET="your_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GITHUB_CLIENT_ID="your_github_id"
GITHUB_CLIENT_SECRET="your_github_secret"
EMAIL_USER="your_email"
EMAIL_PASS="your_email_password"
FRONTEND_URL="http://localhost:5173"
REDIS_URL="redis://localhost:6379"
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:4000
```

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS, Motion
- **Backend:** Fastify, Prisma, PostgreSQL, Redis
- **Auth:** JWT, OAuth (Google, GitHub, Apple)
- **Real-time:** WebSockets

## Features

✅ Multi-provider authentication (Email, Google, GitHub, Apple)
✅ Profile completion flow
✅ Session management with Redis
✅ Rate limiting & IP lockout
✅ Audit logging
✅ Real-time WebSocket foundation

## Project Structure

```
scribblex/
├── backend/
│   ├── prisma/          # Database schema & migrations
│   ├── src/
│   │   ├── config/      # Environment config
│   │   ├── middleware/  # Auth middleware
│   │   ├── plugins/     # Fastify plugins
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utilities
│   └── server.ts
└── frontend/
    └── src/
        ├── components/  # React components
        ├── context/     # Auth context
        ├── lib/         # API client
        ├── pages/       # Route pages
        └── utils/       # Utilities
```

## API Endpoints

### Auth
- `POST /auth/signup` - Email signup
- `POST /auth/login` - Email login
- `POST /auth/verify-otp` - Verify email
- `GET /auth/google/callback` - Google OAuth
- `GET /auth/github/callback` - GitHub OAuth
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Profile
- `POST /user/complete-profile` - Complete profile
- `PUT /user/profile` - Update profile
- `GET /user/check-username/:username` - Check availability

### Rooms
- `POST /rooms` - Create room
- `GET /rooms` - List rooms

## Development

**Reset Database:**
```bash
cd backend
npx prisma migrate reset
```

**Start Redis:**
```bash
redis-server
```

## License

MIT
