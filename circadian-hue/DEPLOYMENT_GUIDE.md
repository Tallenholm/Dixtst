# 🚀 Circadian Hue Deployment Guide

## Production Deployment on Replit

### Step 1: Pre-Deployment Checklist

- [x] All TypeScript errors resolved
- [x] Security headers configured
- [x] Environment variables documented
- [x] Database migrations ready
- [x] Production build tested

### Step 2: Environment Setup

1. **Database Configuration**
   
   Create a PostgreSQL database (NeonDB recommended):
   ```
   DATABASE_URL=postgresql://user:password@host/database
   ```

2. **Environment Variables**
   
   In Replit Secrets, add:
   ```
   DATABASE_URL=your_database_url
   NODE_ENV=production
   ```

### Step 3: Deploy via Replit

1. **Open Deployment Pane**
   - Click the "Deploy" button in your Replit workspace

2. **Select Deployment Type**
   - Choose "Production" deployment
   - Replit will handle:
     - SSL/TLS certificates
     - Domain configuration
     - Auto-scaling
     - Health checks

3. **Configure Deployment**
   - Name: `circadian-hue`
   - Start command: `npm start`
   - Build command: `npm run build`
   - Health check path: `/api/system/status`

4. **Deploy**
   - Click "Deploy" 
   - Wait for deployment to complete (usually 2-3 minutes)

### Step 4: Post-Deployment Verification

1. **Check Application Health**
   ```bash
   curl https://your-app.replit.app/api/system/status
   ```

2. **Verify WebSocket Connection**
   - Open web app and check real-time updates
   - Look for "WebSocket connected" in console

3. **Test Core Features**
   - [ ] Bridge discovery and pairing
   - [ ] Light control
   - [ ] Schedule visualization
   - [ ] Real-time updates

### Step 5: Mobile App Configuration

Update mobile app to use production URL:

```javascript
// mobile/src/context/ApiContext.tsx
const API_URL = 'https://your-app.replit.app';
```

### Monitoring & Maintenance

1. **Health Monitoring**
   - Replit provides automatic health checks
   - Monitor `/api/system/status` endpoint

2. **Logs**
   - View logs in Replit console
   - Check for errors or warnings

3. **Database Backups**
   - Set up regular backups in NeonDB
   - Export critical data periodically

### Troubleshooting

**WebSocket Connection Issues**
- Ensure CORS is configured for your domain
- Check that WSS protocol is used in production

**Database Connection Errors**
- Verify DATABASE_URL is correct
- Check connection pool settings
- Ensure SSL is enabled for production

**Performance Issues**
- Monitor memory usage in Replit
- Check database query performance
- Enable caching where appropriate

### Scaling Considerations

As your user base grows:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Implement connection pooling
   - Consider read replicas

2. **Caching Strategy**
   - Cache sun times calculations
   - Store light states in memory
   - Implement Redis for session storage

3. **API Rate Limiting**
   - Add rate limiting middleware
   - Implement user authentication
   - Monitor API usage patterns

### Security Hardening

For production:

1. **API Authentication**
   ```javascript
   // Add to server/routes.ts
   app.use('/api', authenticateUser);
   ```

2. **Environment Secrets**
   - Never commit secrets to git
   - Use Replit Secrets for all sensitive data
   - Rotate API keys regularly

3. **HTTPS Only**
   - Replit handles SSL automatically
   - Redirect all HTTP to HTTPS

### Success Metrics

Monitor these KPIs:
- System uptime (target: 99.9%)
- API response time (target: <100ms)
- WebSocket latency (target: <50ms)
- User engagement metrics

## 🎉 Congratulations!

Your Circadian Hue system is now live and helping users optimize their lighting for better sleep and productivity!