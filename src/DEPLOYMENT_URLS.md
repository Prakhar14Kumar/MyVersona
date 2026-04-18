# VerSona - Deployment URLs

**Last Updated:** [Update after deployment]  
**Status:** 🟡 Pending deployment

---

## 🌐 PRODUCTION URLS

### **Frontend**
- **Platform:** Vercel
- **URL:** `https://_____________________.vercel.app`
- **Status:** ❌ Not deployed
- **Deploy Command:** `cd frontend && vercel --prod`
- **Environment:** Production

### **Backend (Main API)**
- **Platform:** Railway / Render
- **URL:** `https://_____________________.railway.app`
- **Status:** ❌ Not deployed
- **Deploy Command:** `cd backend && railway up`
- **Environment:** Production
- **Health Check:** `[URL]/health`

### **ML Backend (AI Services)**
- **Platform:** Railway / Render
- **URL:** `https://_____________________.railway.app`
- **Status:** ❌ Not deployed
- **Deploy Command:** `cd python-backend && railway up`
- **Environment:** Production
- **Health Check:** `[URL]/health`

### **Database**
- **Platform:** Firebase Firestore
- **Project ID:** `_____________________`
- **Console:** `https://console.firebase.google.com/project/[PROJECT_ID]`
- **Status:** ✅ Active

### **Authentication**
- **Platform:** Firebase Auth
- **Status:** ✅ Active
- **Console:** `https://console.firebase.google.com/project/[PROJECT_ID]/authentication`

### **Storage**
- **Platform:** Firebase Storage
- **Status:** ✅ Active
- **Bucket:** `[PROJECT_ID].appspot.com`

---

## 📋 DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] Generate SECRET_KEY for backend
- [ ] Get Gemini API key for ML backend
- [ ] Download Firebase service account credentials
- [ ] Create `.env` files for all services
- [ ] Test local setup one final time

### **Firebase Deployment**
- [ ] `firebase deploy --only firestore:indexes`
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only storage`
- [ ] Verify indexes in Firebase console

### **Frontend Deployment (Vercel)**
- [ ] `cd frontend && npm install`
- [ ] `npm run build` (test build locally)
- [ ] `vercel login`
- [ ] `vercel --prod`
- [ ] Add environment variables in Vercel dashboard:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_API_URL` (backend URL)
  - `VITE_PYTHON_API_URL` (ML backend URL)
- [ ] Redeploy after adding env vars

### **Backend Deployment (Railway)**
- [ ] `cd backend && railway login`
- [ ] `railway init`
- [ ] Add environment variables in Railway dashboard:
  - `SECRET_KEY`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CREDENTIALS` (paste JSON content)
  - `ALLOWED_ORIGINS` (frontend URL)
  - `DEBUG=False`
  - `HOST=0.0.0.0`
  - `PORT=8000`
- [ ] `railway up`
- [ ] Test health endpoint

### **ML Backend Deployment (Railway)**
- [ ] `cd python-backend && railway login`
- [ ] `railway init`
- [ ] Add environment variables:
  - `GEMINI_API_KEY`
  - `PORT=8001`
- [ ] `railway up`
- [ ] Test health endpoint

### **Post-Deployment**
- [ ] Update frontend CORS in backend config
- [ ] Smoke test all features
- [ ] Seed demo data
- [ ] Test from different devices
- [ ] Update this file with actual URLs

---

## 🔗 DEMO ACCOUNTS

### **Account 1 (Primary Demo)**
- **Email:** `demo1@versona.app`
- **Password:** `Demo@123`
- **Name:** Arjun Sharma
- **College:** IIT Delhi
- **Use:** Main demo walkthrough

### **Account 2**
- **Email:** `demo2@versona.app`
- **Password:** `Demo@123`
- **Name:** Priya Gupta
- **College:** BITS Pilani
- **Use:** Chat demo, follow demo

### **Account 3**
- **Email:** `demo3@versona.app`
- **Password:** `Demo@123`
- **Name:** Rahul Verma
- **College:** NIT Trichy
- **Use:** Backup account

---

## 📊 MONITORING

### **Frontend Monitoring**
- **Vercel Analytics:** `https://vercel.com/[your-team]/[project]/analytics`
- **Error Tracking:** Vercel Logs

### **Backend Monitoring**
- **Railway Logs:** `railway logs`
- **Health Endpoint:** Check every 5 minutes
- **Status:** Monitor Railway dashboard

### **Firebase Monitoring**
- **Firestore Usage:** Console → Usage tab
- **Auth Users:** Console → Authentication
- **Storage Usage:** Console → Storage

---

## 🚨 TROUBLESHOOTING

### **Frontend not loading**
1. Check Vercel deployment status
2. Check browser console for errors
3. Verify environment variables in Vercel
4. Check if backend URL is correct

### **API calls failing**
1. Check backend is running (health endpoint)
2. Verify CORS is configured correctly
3. Check network tab in browser
4. Verify API_URL in frontend env vars

### **WebSocket not connecting**
1. Check backend WebSocket endpoint
2. Verify WSS protocol (not WS)
3. Check firewall/proxy settings
4. Test with different network

### **Firebase errors**
1. Check service account credentials
2. Verify indexes are deployed
3. Check security rules
4. Monitor quota usage

---

## 📈 PERFORMANCE METRICS

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Frontend Load Time** | <2s | ___ s | ⏳ |
| **API Response Time** | <500ms | ___ ms | ⏳ |
| **WebSocket Latency** | <100ms | ___ ms | ⏳ |
| **Uptime** | 99%+ | ___% | ⏳ |

**Update after deployment**

---

## 💰 COST ESTIMATE

### **Monthly Costs (100 users)**

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** | Hobby (free) | $0 |
| **Railway** | Starter ($5/service) | $10 |
| **Firebase** | Spark (free tier) | $0-5 |
| **Gemini AI** | Pay-per-use | $5-10 |
| **Total** | | **$15-25/month** |

### **Scaling Costs (1000 users)**
- Vercel Pro: $20/month
- Railway (2 services): $40/month
- Firebase Blaze: $25-50/month
- Gemini AI: $25-50/month
- **Total:** $110-160/month

---

## 🔐 SECURITY

### **Environment Variables (Never commit to Git!)**
- ✅ All `.env` files in `.gitignore`
- ✅ Use Railway/Vercel dashboard for secrets
- ✅ Rotate keys periodically
- ✅ Limit CORS to specific domains

### **API Keys**
- 🔑 Firebase Admin SDK (backend only)
- 🔑 Gemini API key (ML backend only)
- 🔑 SECRET_KEY (backend only)
- 🚫 Never expose in frontend

---

## 📝 DEPLOYMENT LOG

**Template:**
```
[Date] [Time] - [Service] deployed
- Deployed by: [Name]
- Version: [commit hash]
- Status: [Success/Failed]
- Notes: [Any issues or changes]
```

**Example:**
```
2026-03-17 10:30 AM - Frontend deployed
- Deployed by: [Your Name]
- Version: abc123f
- Status: Success
- URL: https://versona.vercel.app
- Notes: First production deployment
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. [ ] Update this file with actual URLs
2. [ ] Run smoke tests on deployed app
3. [ ] Seed demo data: `python scripts/seed-demo-data.py`
4. [ ] Share URL with team/friends for testing
5. [ ] Monitor for errors in first 24 hours
6. [ ] Practice demo with deployed version
7. [ ] Take screenshots for presentation

---

**Instructions:**
1. Deploy each service
2. Update URLs above with actual deployment URLs
3. Test thoroughly
4. Keep this file updated as single source of truth
5. Share with team members

**Status Key:**
- ✅ Active/Deployed
- 🟡 In Progress
- ❌ Not Started
- ⏳ Pending Data

---

**Quick Copy Template (After Deployment):**

```
VerSona Demo URLs

Frontend: https://_____.vercel.app
Backend: https://_____.railway.app
Demo Login: demo1@versona.app / Demo@123
```

---

**Last Updated:** [Update this after deployment]  
**Next Review:** After deployment complete
