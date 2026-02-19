# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or use Neon - already configured)
- Git

## Setup (First Time)

### 1. Clone & Install
```bash
cd scribblex

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=4000
DATABASE_URL="your_postgres_url"
JWT_SECRET="change_this_in_production"
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
NODE_ENV=development

# Optional: Redis for session caching
REDIS_URL=

# Email (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3. Database Setup
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Running the Application

### Development Mode

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```
Server starts on http://localhost:4000

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
App opens on http://localhost:5173

## Testing the Application

### 1. Create Account
- Go to http://localhost:5173
- Click "Sign up with Email"
- Enter email, password, name
- Verify OTP from email

### 2. Complete Profile
- Draw your avatar
- Fill in profile details
- Submit

### 3. Create Room
- Click "Create Room"
- Enter title and description
- Choose visibility (Public/Private)
- Create

### 4. Test Collaboration
- Open room in two browser windows
- Add shapes (rectangles/circles)
- Drag elements
- Delete with button or Delete/Backspace key
- See real-time sync between windows

## Features Available

✅ **Authentication**
- Email/Password signup with OTP
- Google OAuth
- Session management
- Token refresh

✅ **Profile**
- Avatar drawing canvas
- Profile completion
- Edit profile

✅ **Rooms**
- Create public/private rooms
- Join rooms
- Real-time user presence
- Room discovery (Explore/My Rooms)

✅ **Canvas**
- Add rectangles and circles
- Drag elements
- Delete elements (button or keyboard)
- Pan and zoom (mouse wheel)
- Real-time collaboration
- Mobile touch support

## Troubleshooting

### Backend won't start
```bash
# Check if port 4000 is available
netstat -ano | findstr :4000

# Check database connection
cd backend
npx prisma studio
```

### Frontend won't connect
- Verify backend is running on port 4000
- Check `frontend/.env` has correct API URL
- Clear browser cache and localStorage

### Socket connection fails
- Check CORS settings in backend
- Verify token is stored in localStorage
- Check browser console for errors

### Redis warnings
- Redis is optional for development
- Warnings are normal if REDIS_URL is empty
- Enable Redis in production for better performance

## Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Environment Variables
- Change `JWT_SECRET` to strong random string
- Set `NODE_ENV=production`
- Enable Redis with `REDIS_URL`
- Configure SSL/TLS
- Set up proper CORS origins

## Project Structure

```
scribblex/
├── backend/          # Fastify + Socket.IO server
├── frontend/         # React + Vite app
├── docs/            # Documentation
├── phases.md        # Development roadmap
└── PRODUCTION_AUDIT.md  # Production checklist
```

## Next Steps

1. **Test all features** - Go through the testing checklist
2. **Enable Redis** - For production performance
3. **Step 5: Spatial Audio** - Follow phases.md
4. **Deploy to staging** - Test in production-like environment

## Support

- Check `PRODUCTION_AUDIT.md` for detailed system info
- Check `CLEANUP_COMPLETE.md` for recent changes
- Check `phases.md` for development roadmap

## Common Commands

```bash
# Backend
npm run dev          # Development server
npm run build        # Build for production
npm start           # Run production build
npm run reset-db    # Reset database (careful!)

# Frontend
npm run dev         # Development server
npm run build       # Build for production
npm run preview     # Preview production build

# Database
npx prisma studio   # Open database GUI
npx prisma migrate dev  # Create new migration
npx prisma generate # Generate Prisma client
```

---

**Status**: ✅ Ready to run  
**Last Updated**: December 2024
