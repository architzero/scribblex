# ScribbLeX - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Domain name
- SSL certificate

---

## Option 1: Railway (Recommended)

### Backend Deployment

1. **Create Railway Account**
   ```
   https://railway.app
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select `backend` folder

3. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-super-secret-key-change-this
   JWT_REFRESH_SECRET=your-refresh-secret-key
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   PORT=4000
   ```

4. **Build Settings**
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Root Directory: `backend`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Copy the public URL

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   ```
   https://vercel.com
   ```

2. **Import Project**
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Framework: Vite
   - Root Directory: `frontend`

3. **Environment Variables**
   ```env
   VITE_API_URL=https://your-backend.railway.app
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```

4. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Wait for build
   - Your app is live!

---

## Option 2: AWS (Advanced)

### Architecture
```
CloudFront (CDN)
    ↓
S3 (Frontend Static Files)

ALB (Load Balancer)
    ↓
ECS Fargate (Backend Containers)
    ↓
RDS PostgreSQL (Database)
```

### Steps

1. **Database (RDS)**
   ```bash
   # Create PostgreSQL instance
   aws rds create-db-instance \
     --db-instance-identifier scribblex-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password <password> \
     --allocated-storage 20
   ```

2. **Backend (ECS)**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   EXPOSE 4000
   CMD ["npm", "start"]
   ```

   ```bash
   # Build and push
   docker build -t scribblex-backend .
   docker tag scribblex-backend:latest <ecr-url>
   docker push <ecr-url>
   ```

3. **Frontend (S3 + CloudFront)**
   ```bash
   # Build
   cd frontend
   npm run build
   
   # Upload to S3
   aws s3 sync dist/ s3://scribblex-frontend
   
   # Create CloudFront distribution
   aws cloudfront create-distribution \
     --origin-domain-name scribblex-frontend.s3.amazonaws.com
   ```

---

## Option 3: DigitalOcean (Simple)

### Droplet Setup

1. **Create Droplet**
   - Ubuntu 22.04
   - 2GB RAM minimum
   - Enable backups

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   
   # Nginx
   sudo apt-get install nginx
   
   # PM2
   sudo npm install -g pm2
   ```

4. **Setup Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE scribblex;
   CREATE USER scribblex WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE scribblex TO scribblex;
   \q
   ```

5. **Deploy Backend**
   ```bash
   cd /var/www
   git clone https://github.com/your-repo/scribblex.git
   cd scribblex/backend
   npm install
   npx prisma migrate deploy
   
   # Create .env
   nano .env
   # Add environment variables
   
   # Start with PM2
   pm2 start npm --name "scribblex-backend" -- start
   pm2 save
   pm2 startup
   ```

6. **Deploy Frontend**
   ```bash
   cd /var/www/scribblex/frontend
   npm install
   npm run build
   
   # Copy to nginx
   sudo cp -r dist/* /var/www/html/
   ```

7. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/scribblex
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /var/www/html;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # WebSocket
       location /socket.io {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/scribblex /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Environment Variables (Complete)

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com
VITE_API_BASE_URL=https://your-backend-domain.com
```

---

## Post-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Set secure JWT secrets (32+ chars)
- [ ] Enable CORS only for your domain
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Add input validation
- [ ] Sanitize user inputs

### Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add Google Analytics or Mixpanel
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up log aggregation (Logtail)
- [ ] Enable database backups
- [ ] Set up alerts for errors

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Minify JS/CSS
- [ ] Enable gzip compression
- [ ] Set up database connection pooling

### Testing
- [ ] Test all authentication flows
- [ ] Test real-time collaboration
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Load test with 100+ users
- [ ] Test error scenarios

---

## Monitoring Setup

### Sentry (Error Tracking)

1. **Install**
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **Backend Setup**
   ```typescript
   // backend/src/server.ts
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

3. **Frontend Setup**
   ```typescript
   // frontend/src/main.tsx
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: process.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
   });
   ```

### Analytics (Mixpanel)

1. **Install**
   ```bash
   npm install mixpanel-browser
   ```

2. **Setup**
   ```typescript
   // frontend/src/lib/analytics.ts
   import mixpanel from 'mixpanel-browser';
   
   mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN);
   
   export const track = (event: string, properties?: any) => {
     mixpanel.track(event, properties);
   };
   ```

3. **Track Events**
   ```typescript
   track('Room Created', { visibility: 'public' });
   track('Node Added', { color: '#FFE66D' });
   track('Drawing Started', { tool: 'pen' });
   ```

---

## Backup Strategy

### Database Backups

1. **Automated Daily Backups**
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump $DATABASE_URL > backup_$DATE.sql
   
   # Upload to S3
   aws s3 cp backup_$DATE.sql s3://scribblex-backups/
   
   # Keep only last 30 days
   find . -name "backup_*.sql" -mtime +30 -delete
   ```

2. **Schedule with Cron**
   ```bash
   crontab -e
   # Add: 0 2 * * * /path/to/backup.sh
   ```

### Application Backups
- Code: GitHub (automatic)
- Uploads: S3 with versioning
- Config: Encrypted in 1Password

---

## Scaling Strategy

### Horizontal Scaling
```
Load Balancer
    ↓
Backend Instance 1 ─┐
Backend Instance 2 ─┼─→ Redis (Session Store)
Backend Instance 3 ─┘
    ↓
Database (Read Replicas)
```

### When to Scale
- CPU usage > 70% sustained
- Memory usage > 80%
- Response time > 500ms
- 1000+ concurrent users

### How to Scale
1. Add more backend instances
2. Use Redis for session storage
3. Add database read replicas
4. Enable CDN for static assets
5. Implement caching layer

---

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS settings
   - Verify SSL/TLS configuration
   - Check firewall rules
   - Enable WebSocket in load balancer

2. **Database Connection Pool Exhausted**
   - Increase pool size
   - Check for connection leaks
   - Add connection timeout
   - Use connection pooler (PgBouncer)

3. **High Memory Usage**
   - Check for memory leaks
   - Optimize CRDT document size
   - Clear old drawing data
   - Restart instances regularly

4. **Slow Response Times**
   - Add database indexes
   - Enable query caching
   - Optimize N+1 queries
   - Use CDN for assets

---

## Cost Estimation

### Railway + Vercel (Starter)
- Railway: $5-20/month
- Vercel: Free (Hobby)
- Neon DB: Free (512MB)
- **Total: $5-20/month**

### DigitalOcean (Small)
- Droplet: $12/month (2GB)
- Database: $15/month
- Backups: $2/month
- **Total: $29/month**

### AWS (Production)
- ECS Fargate: $30/month
- RDS: $50/month
- S3 + CloudFront: $10/month
- Load Balancer: $20/month
- **Total: $110/month**

---

## 🎉 You're Ready to Deploy!

Choose your deployment option, follow the steps, and launch your app to the world!

**Good luck! 🚀**
