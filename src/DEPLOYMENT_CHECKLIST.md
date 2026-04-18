# VerSona Deployment Checklist

## Pre-Deployment Tasks

### 1. Environment Configuration ✅
- [x] All Firebase credentials in environment variables
- [x] Backend URL configured
- [x] WebSocket URL configured
- [ ] Production API keys added to hosting platform

### 2. Build Verification
```bash
# Test production build
npm run build

# Preview production build
npm run preview

# Check for build errors
npm run type-check
```

### 3. Backend Deployment
```bash
# Test backend locally
cd backend
python main.py

# Verify endpoints:
# - http://localhost:8000/health
# - http://localhost:8000/docs
# - ws://localhost:8000/ws
```

### 4. Firebase Configuration
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Storage rules deployed (`firebase deploy --only storage`)
- [ ] Authentication providers enabled

### 5. Database Verification
```bash
# Run user migration if needed
node scripts/fixUsers.js

# Verify Firestore collections:
# - users
# - posts
# - chats
# - bookmarks
# - notifications
```

## Deployment Steps

### Frontend Deployment (Vercel/Netlify/Firebase Hosting)

#### Option A: Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option C: Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Backend Deployment

#### Option A: Railway
```bash
# Add Railway config
echo "web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT" > Procfile

# Deploy
railway up
```

#### Option B: Render
- Create new Web Service
- Connect GitHub repo
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

#### Option C: Google Cloud Run
```bash
# Build Docker image
docker build -t versona-backend ./backend

# Deploy to Cloud Run
gcloud run deploy versona-backend \
  --image versona-backend \
  --platform managed \
  --region asia-south1
```

### Python ML Backend Deployment
```bash
cd python-backend
pip install -r requirements.txt

# Deploy alongside main backend
# Or as separate microservice
```

## Post-Deployment Verification

### Frontend Tests
- [ ] Landing page loads
- [ ] Login/Signup works
- [ ] Feed displays posts
- [ ] Search functions
- [ ] Chat works
- [ ] Notifications show
- [ ] Profile pages load
- [ ] Bookmarks page works
- [ ] File uploads work

### Backend Tests
```bash
# Test API endpoints
curl https://your-backend-url.com/health

# Test authentication
# (use Postman or similar)

# Test WebSocket
# (use wscat or browser console)
```

### Firebase Tests
- [ ] User creation
- [ ] Post creation
- [ ] Chat creation
- [ ] Firestore rules working
- [ ] Storage uploads working

## Performance Optimization

### Frontend
- [ ] Enable Vite build optimizations
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set cache headers

### Backend
- [ ] Enable Redis caching (if available)
- [ ] Configure rate limiting
- [ ] Set up request logging
- [ ] Monitor API response times

### Database
- [ ] Firestore indexes optimized
- [ ] Query performance verified
- [ ] Data validation rules active

## Monitoring Setup

### Error Tracking
```bash
# Install Sentry (optional)
npm install @sentry/react

# Configure in main.tsx
```

### Analytics
- [ ] Google Analytics configured
- [ ] User behavior tracking enabled
- [ ] Performance monitoring active

### Logging
- [ ] Backend logs configured
- [ ] Frontend error logging
- [ ] User action logging (privacy-compliant)

## Security Checklist

### Frontend
- [x] No hardcoded credentials
- [x] Environment variables used
- [x] HTTPS enforced
- [ ] CSP headers configured
- [x] XSS protection enabled

### Backend
- [x] CORS configured
- [x] Rate limiting active
- [x] Input validation
- [x] SQL injection protection
- [ ] DDoS protection enabled

### Firebase
- [x] Firestore rules enforced
- [x] Storage rules enforced
- [x] Authentication required
- [ ] Audit logs enabled

## Go-Live Steps

1. **Final Testing**
   ```bash
   # Run all tests
   npm test
   npm run e2e # if available
   ```

2. **Update DNS (if using custom domain)**
   - Point domain to hosting provider
   - Configure SSL certificate
   - Verify HTTPS works

3. **Deploy to Production**
   ```bash
   # Frontend
   npm run build
   [deploy command for your platform]

   # Backend
   [deploy command for your platform]
   ```

4. **Monitor Deployment**
   - Check error logs
   - Monitor performance
   - Verify all features work
   - Test on different devices

5. **Announce Launch**
   - Update status page
   - Notify beta users
   - Monitor feedback channels

## Rollback Plan

If issues occur:

1. **Frontend Rollback**
   ```bash
   # Vercel
   vercel rollback

   # Netlify
   netlify rollback

   # Firebase
   firebase hosting:rollback
   ```

2. **Backend Rollback**
   - Redeploy previous version
   - Check database integrity
   - Verify services are running

3. **Database Rollback**
   - Use Firestore export/import
   - Restore from backup
   - Verify data consistency

## Post-Launch Monitoring (First 24 Hours)

### Metrics to Watch
- [ ] API response times
- [ ] Error rates
- [ ] User registrations
- [ ] Active users
- [ ] Database read/write operations
- [ ] Storage usage
- [ ] WebSocket connections

### User Feedback Channels
- [ ] In-app feedback button active
- [ ] Email support monitored
- [ ] Social media monitoring
- [ ] Bug report tracking

## Backup Strategy

### Firestore
```bash
# Export data
gcloud firestore export gs://[BUCKET_NAME]

# Schedule daily backups
# (configure in GCP Console)
```

### Storage
- Enable versioning on Firebase Storage
- Set up automated backups

### Code
- [ ] Git repository backed up
- [ ] Environment variables documented
- [ ] Deployment configs saved

## Support Resources

### Documentation
- [Firebase Console](https://console.firebase.google.com)
- [Backend API Docs](https://your-backend-url.com/docs)
- [Architecture Docs](/docs/architecture/)

### Team Contacts
- Backend Lead: [contact]
- Frontend Lead: [contact]
- DevOps: [contact]
- Product Manager: [contact]

## Success Criteria

Launch is successful when:
- ✅ All critical features work
- ✅ No critical bugs reported
- ✅ Performance meets SLA
- ✅ Error rate < 1%
- ✅ Positive user feedback
- ✅ Monitoring dashboards green

---

**Ready to deploy! 🚀**

Last updated: April 2, 2026
