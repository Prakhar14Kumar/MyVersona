# VerSona Local Setup and Run Guide

**Complete guide to run the entire VerSona system on your local machine.**

Last Updated: February 22, 2026

---

## 1. Project Overview

### What is VerSona?

VerSona is a youth-focused, Indian-first social and professional networking platform designed for students and young professionals. It combines social networking features with career development tools, powered by AI.

### Key Features

- **Double Feed System**: Separate Social and Professional feeds
- **Double Chat System**: Personal and Professional messaging
- **Rich Profiles**: Multi-section profiles with education, experience, skills
- **AI-Powered Features**: Resume parsing, career assistance, content moderation
- **Real-time Communication**: WebSocket-based messaging and notifications

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend API | FastAPI (Python) |
| AI Backend | Flask/FastAPI (Python) with 8 ML models |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Storage | Firebase Storage |
| Analytics | Firebase Analytics (GA4) |
| Real-time | WebSockets |

### System Components

The VerSona system consists of **3 separate services** that must all run simultaneously:

1. **React Frontend** - Port `5173`
   - User interface and client-side logic
   - Vite development server

2. **FastAPI Backend** - Port `8000`
   - Main API server
   - WebSocket server
   - Firebase integration
   - Business logic

3. **Python AI Backend** - Port `5000`
   - 8 custom ML models
   - Resume parsing
   - Career assistance
   - Content moderation
   - Recommendation engines

---

## 2. System Requirements

### Required Software

Before starting, ensure you have the following installed:

| Software | Minimum Version | Check Command |
|----------|----------------|---------------|
| Node.js | 18.x or higher | `node --version` |
| npm | 9.x or higher | `npm --version` |
| Python | 3.10 or higher | `python --version` or `python3 --version` |
| pip | Latest | `pip --version` or `pip3 --version` |
| Git | Any recent version | `git --version` |

### Optional Software

| Software | Purpose |
|----------|---------|
| Firebase CLI | Deploy Firestore rules/indexes |
| Redis | Caching (if enabled) |
| VS Code | Recommended IDE |

### System Resources

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 2GB free space
- **Internet**: Required for Firebase and API calls

### Operating Systems Supported

- macOS (Apple Silicon & Intel)
- Windows 10/11
- Linux (Ubuntu 20.04+)

---

## 3. Project Structure

```
versona/
├── frontend/                # React Frontend Application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities (Firebase, Analytics)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   ├── .env                # Frontend environment variables
│   └── package.json        # Frontend dependencies
│
├── backend/                # FastAPI Backend
│   ├── main.py            # FastAPI app entry point
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions
│   ├── credentials.json   # Firebase service account (YOU MUST CREATE THIS)
│   ├── .env              # Backend environment variables
│   └── requirements.txt   # Python dependencies
│
├── python-backend/        # AI/ML Backend
│   ├── main.py           # AI server entry point
│   ├── models/           # ML model files
│   ├── services/         # ML services (resume, career, etc.)
│   ├── .env             # AI backend environment variables
│   └── requirements.txt  # Python dependencies
│
├── firebase/             # Firebase configuration
│   ├── firestore.rules  # Security rules
│   ├── firestore.indexes.json  # Database indexes
│   └── firebase.json    # Firebase config
│
└── docs/                # Documentation
    └── LOCAL_SETUP_AND_RUN.md  # This file
```

---

## 4. Environment Variables

You need to create **3 separate `.env` files** for the 3 components.

### 4.1 Backend `.env`

**Location**: `/backend/.env`

```env
# Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Firebase
FIREBASE_CREDENTIALS_PATH=./credentials.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# AI/ML APIs
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Redis (if using caching)
REDIS_URL=redis://localhost:6379

# Optional: Environment
ENVIRONMENT=development
```

**How to get values:**

- `SECRET_KEY`: Generate random string (e.g., `openssl rand -hex 32`)
- `FIREBASE_STORAGE_BUCKET`: Found in Firebase Console → Project Settings
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4.2 Frontend `.env`

**Location**: `/frontend/.env`

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# WebSocket URL
VITE_WS_URL=ws://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGS=true
```

**How to get Firebase config values:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click Settings (gear icon) → Project Settings
4. Scroll down to "Your apps" section
5. Click "Web app" or add a new web app
6. Copy the config object values to your `.env` file

### 4.3 Python AI Backend `.env`

**Location**: `/python-backend/.env`

```env
# AI/ML APIs
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Model paths (if custom)
MODEL_PATH=./models

# Optional: Environment
ENVIRONMENT=development
PORT=5000
```

### 4.4 Firebase Service Account JSON

**Location**: `/backend/credentials.json`

This is a **critical file** required for backend Firebase access.

**How to get it:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click Settings (gear icon) → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file
7. Rename it to `credentials.json`
8. Place it in `/backend/` folder

**⚠️ SECURITY WARNING**: Never commit `credentials.json` to Git. It's already in `.gitignore`.

---

## 5. Install Dependencies

Install dependencies for all 3 components in order.

### 5.1 Frontend Dependencies

```bash
# Navigate to frontend folder
cd frontend

# Install Node.js dependencies
npm install

# Verify installation
npm list react
```

**Expected time**: 2-5 minutes depending on internet speed.

**Common packages installed**:
- React 18
- React Router
- Firebase SDK
- TailwindCSS
- Lucide React (icons)
- Date-fns, etc.

### 5.2 Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

**Expected time**: 3-7 minutes.

**Common packages installed**:
- FastAPI
- Uvicorn
- Firebase Admin SDK
- Pydantic
- python-dotenv
- WebSockets support

### 5.3 AI Backend Dependencies

```bash
# Navigate to python-backend folder
cd python-backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

**Expected time**: 5-10 minutes (ML packages are large).

**Common packages installed**:
- Flask or FastAPI
- TensorFlow or PyTorch
- Transformers
- scikit-learn
- pandas, numpy
- Google Generative AI

---

## 6. Firebase Setup

### 6.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "versona-dev")
4. Enable Google Analytics (recommended)
5. Click "Create Project"

### 6.2 Enable Required Firebase Services

#### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable sign-in methods:
   - ✅ Email/Password
   - ✅ Google (recommended)
   - ✅ Phone (optional)

#### Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Choose "Start in **test mode**" for development
4. Select location (choose closest to you)
5. Click "Enable"

#### Enable Storage

1. In Firebase Console, go to "Storage"
2. Click "Get Started"
3. Start in **test mode** for development
4. Click "Done"

#### Enable Analytics (Optional)

1. In Firebase Console, go to "Analytics"
2. Analytics is usually enabled by default
3. Note your Measurement ID (starts with `G-`)

### 6.3 Configure Firestore Security Rules

**For development, use test mode rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: These rules allow anyone to read/write. Only use for local development!

**To deploy rules:**

```bash
# If you have Firebase CLI installed
firebase deploy --only firestore:rules
```

### 6.4 Deploy Firestore Indexes (If Needed)

Some queries require composite indexes.

```bash
# Navigate to project root
cd versona

# Deploy indexes
firebase deploy --only firestore:indexes
```

If you don't have Firebase CLI or get errors, you can skip this. Firestore will prompt you to create indexes when needed.

### 6.5 Download Service Account Key

See section **4.4 Firebase Service Account JSON** above.

---

## 7. Run Services (Order Important)

You need **3 separate terminal windows/tabs** to run all services.

### 7.1 Start Backend (Terminal 1)

```bash
# Navigate to backend folder
cd backend

# Activate virtual environment if not already active
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verify**: Open browser to `http://localhost:8000/docs` - you should see FastAPI Swagger docs.

### 7.2 Start AI Backend (Terminal 2)

```bash
# Navigate to python-backend folder
cd python-backend

# Activate virtual environment if not already active
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Start AI server
python main.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
INFO: AI Models loaded successfully
```

**Verify**: Open browser to `http://localhost:5000/health` - you should see health check response.

### 7.3 Start Frontend (Terminal 3)

```bash
# Navigate to frontend folder
cd frontend

# Start Vite dev server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Verify**: Open browser to `http://localhost:5173/` - you should see VerSona app.

### 7.4 Startup Order Summary

**IMPORTANT**: Start services in this order:

1. ✅ Backend first (port 8000)
2. ✅ AI Backend second (port 5000)
3. ✅ Frontend last (port 5173)

The frontend depends on both backend services being ready.

### 7.5 Keeping Services Running

- Keep all 3 terminal windows open
- Don't close any terminals
- To stop: Press `CTRL+C` in each terminal

---

## 8. Verify System

Follow these steps to confirm everything is working.

### 8.1 Check All Services Are Running

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Backend API | `http://localhost:8000/docs` | FastAPI Swagger UI |
| Backend Health | `http://localhost:8000/health` | `{"status": "ok"}` |
| AI Backend | `http://localhost:5000/health` | Health check response |
| Frontend | `http://localhost:5173/` | VerSona app loads |

### 8.2 Test Authentication

1. Open `http://localhost:5173/`
2. Click "Sign Up" or "Get Started"
3. Create a new account with email/password
4. You should be redirected to home/feed

**Check browser console (F12)** - you should see:
- ✅ No red errors
- ✅ Firebase Analytics events logged (if enabled)
- ✅ WebSocket connection established

### 8.3 Test Core Features

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **Feed** | Navigate to home | Posts load (may be empty) |
| **Profile** | Click profile icon | Profile page loads |
| **Create Post** | Click "Create Post" | Modal opens |
| **Search** | Use search bar | Search results appear |
| **Chat** | Open messages | Chat interface loads |
| **Notifications** | Click bell icon | Notifications dropdown |

### 8.4 Check Browser Console

Press `F12` to open DevTools, go to Console tab.

**Good signs:**
- ✅ "Firebase initialized successfully"
- ✅ "Analytics initialized"
- ✅ "WebSocket connected"
- ✅ API requests returning 200 status

**Bad signs:**
- ❌ CORS errors
- ❌ Firebase errors
- ❌ 404 or 500 errors
- ❌ WebSocket connection failed

### 8.5 Check Network Tab

In DevTools → Network tab:

- ✅ Requests to `localhost:8000` succeeding (green)
- ✅ WebSocket connection active (ws://)
- ✅ Firebase requests succeeding

### 8.6 Test Real-time Features

**Test WebSocket:**
1. Open app in 2 browser tabs
2. Send a message from tab 1
3. Tab 2 should receive it in real-time

**Test Notifications:**
1. Create a post in tab 1
2. Like it from tab 2
3. Tab 1 should show notification

---

## 9. Common Errors & Fixes

### 9.1 Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Cause**: Another process is using the port.

**Fix:**

```bash
# Find process using port
# macOS/Linux:
lsof -i :8000
kill -9 <PID>

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use a different port:
uvicorn main:app --reload --port 8001
```

### 9.2 Firebase Permission Denied

**Error:**
```
FirebaseError: Missing or insufficient permissions
```

**Cause**: Firestore security rules are too strict.

**Fix:**

1. Go to Firebase Console → Firestore → Rules
2. Temporarily use test mode rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
3. Click "Publish"

### 9.3 Firebase Credentials Not Found

**Error:**
```
Error: Could not load credentials from ./credentials.json
```

**Cause**: Service account JSON file missing.

**Fix:**

1. Download service account JSON (see section 4.4)
2. Place in `/backend/credentials.json`
3. Verify path in `/backend/.env`:
```env
FIREBASE_CREDENTIALS_PATH=./credentials.json
```

### 9.4 Gemini API Key Invalid

**Error:**
```
Error: Invalid API key
```

**Cause**: Missing or incorrect Gemini API key.

**Fix:**

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `/backend/.env` and `/python-backend/.env`:
```env
GEMINI_API_KEY=your-actual-key-here
```
3. Restart backend services

### 9.5 CORS Error

**Error:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause**: Backend CORS not configured for frontend.

**Fix:**

Check `/backend/main.py` has CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart backend after changes.

### 9.6 WebSocket Connection Failed

**Error in console:**
```
WebSocket connection to 'ws://localhost:8000' failed
```

**Cause**: Backend not running or WebSocket not configured.

**Fix:**

1. Ensure backend is running on port 8000
2. Check `.env` has correct WebSocket URL:
```env
VITE_WS_URL=ws://localhost:8000
```
3. Restart frontend

### 9.7 Analytics Events Not Firing

**Error**: No events in Firebase Analytics dashboard.

**Cause**: Analytics not initialized or disabled.

**Fix:**

1. Verify `.env` has analytics enabled:
```env
VITE_ENABLE_ANALYTICS=true
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```
2. Check browser console for analytics logs
3. Note: Analytics data can take 24-48 hours to appear in dashboard
4. Use DebugView for real-time testing:
   - Firebase Console → Analytics → DebugView
   - Add `?debug_mode=true` to URL

### 9.8 Module Not Found Errors

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Cause**: Dependencies not installed or virtual environment not activated.

**Fix:**

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt

# For frontend:
cd frontend
npm install
```

### 9.9 Python Version Mismatch

**Error:**
```
ERROR: Python 3.10 or later is required
```

**Cause**: Python version too old.

**Fix:**

1. Check Python version: `python --version`
2. Install Python 3.10+ from [python.org](https://www.python.org/downloads/)
3. Use `python3` instead of `python` if needed

### 9.10 Firebase App Already Exists

**Error:**
```
FirebaseError: Firebase app named '[DEFAULT]' already exists
```

**Cause**: Firebase initialized multiple times.

**Fix:**

Check `/frontend/src/lib/firebase.ts` only initializes once:

```typescript
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
```

### 9.11 Build Errors

**Error:**
```
npm run build
Error: Unexpected token...
```

**Fix:**

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# For TypeScript errors
npm run type-check
```

---

## 10. Developer Notes

### 10.1 Resetting Firestore Data

To clear all data in development:

**Option 1: Firebase Console**
1. Go to Firestore Database
2. Select a collection
3. Delete documents manually

**Option 2: Use script (if available)**
```bash
cd backend
python scripts/reset_firestore.py
```

**Option 3: Delete and recreate database**
1. Firebase Console → Firestore
2. Settings → Delete database
3. Create new database

### 10.2 Clear Browser Cache

If experiencing issues:

1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

Or clear all site data:
1. DevTools (F12) → Application tab
2. Storage → Clear site data

### 10.3 View Debug Logs

**Backend logs:**
- Appear in Terminal 1 where backend is running
- Add `--log-level debug` for more details:
```bash
uvicorn main:app --reload --port 8000 --log-level debug
```

**Frontend logs:**
- Browser console (F12)
- Enable debug mode in `.env`:
```env
VITE_ENABLE_DEBUG_LOGS=true
```

**AI Backend logs:**
- Appear in Terminal 2 where AI backend is running

### 10.4 Restart Services

If something breaks, restart in this order:

```bash
# 1. Stop all services (CTRL+C in each terminal)

# 2. Clear caches (optional)
cd frontend
rm -rf node_modules/.vite

# 3. Restart in order
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: AI Backend
cd python-backend
source venv/bin/activate
python main.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 10.5 Hot Reload

All services support hot reload:

- **Frontend**: Vite auto-reloads on file changes
- **Backend**: `--reload` flag enables auto-reload
- **AI Backend**: May need manual restart depending on setup

### 10.6 Testing API Endpoints

Use FastAPI Swagger docs for easy API testing:

1. Open `http://localhost:8000/docs`
2. Click on any endpoint
3. Click "Try it out"
4. Fill parameters
5. Click "Execute"

### 10.7 Monitoring Firebase Usage

Keep track of Firebase quotas:

1. Firebase Console → Usage and billing
2. Monitor:
   - Firestore reads/writes
   - Storage usage
   - Authentication users
   - Analytics events

Free tier limits:
- Firestore: 50K reads, 20K writes per day
- Storage: 5GB
- Auth: Unlimited users

### 10.8 Database Backups

**Automatic**: Firestore has automatic backups.

**Manual export**:
```bash
gcloud firestore export gs://your-bucket/backups
```

(Requires Google Cloud SDK)

### 10.9 Working with ML Models

If updating ML models:

1. Place model files in `/python-backend/models/`
2. Update model paths in `.env`
3. Restart AI backend
4. Warm up models by calling endpoints once

### 10.10 Environment Switching

To switch between development and production:

**Backend `.env`:**
```env
ENVIRONMENT=development  # or production
```

**Frontend:** Use different `.env` files:
- `.env.development` - local development
- `.env.production` - production build

Switch by setting `NODE_ENV`:
```bash
NODE_ENV=production npm run dev
```

---

## 11. Quick Reference

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main app |
| Backend API | http://localhost:8000 | API server |
| Backend Docs | http://localhost:8000/docs | Swagger UI |
| AI Backend | http://localhost:5000 | ML services |

### Essential Commands

```bash
# Start backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Start AI backend
cd python-backend && source venv/bin/activate && python main.py

# Start frontend
cd frontend && npm run dev

# Install dependencies
cd frontend && npm install
cd backend && pip install -r requirements.txt
cd python-backend && pip install -r requirements.txt

# Check if ports are in use
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :5000  # AI Backend
```

### File Locations Checklist

Before running, ensure these files exist:

- ✅ `/backend/.env`
- ✅ `/backend/credentials.json`
- ✅ `/frontend/.env`
- ✅ `/python-backend/.env`

---

## 12. Getting Help

### Troubleshooting Steps

1. ✅ Read error message carefully
2. ✅ Check this document's "Common Errors" section
3. ✅ Verify all environment variables are set
4. ✅ Ensure all 3 services are running
5. ✅ Check browser console for errors
6. ✅ Restart services in correct order
7. ✅ Clear browser cache
8. ✅ Check Firebase Console for service status

### Debug Checklist

- [ ] All dependencies installed?
- [ ] All `.env` files created?
- [ ] Firebase credentials downloaded?
- [ ] All 3 services running?
- [ ] No port conflicts?
- [ ] Internet connection active?
- [ ] Browser console shows no errors?

### Verification Commands

```bash
# Check Node.js version
node --version

# Check Python version
python --version

# Check if backend dependencies installed
cd backend && pip list | grep fastapi

# Check if frontend dependencies installed
cd frontend && npm list react

# Check if ports are available
lsof -i :5173 :8000 :5000

# Test backend health
curl http://localhost:8000/health

# Test AI backend health
curl http://localhost:5000/health
```

---

## Success! 🎉

If you've followed all steps and:
- ✅ All 3 services are running without errors
- ✅ Frontend loads at http://localhost:5173
- ✅ You can sign up and log in
- ✅ Feed loads (even if empty)
- ✅ No console errors

**You're ready to develop VerSona!**

---

## Appendix: Project Standards

### Engineering Rules (9 Rules)

1. **No versioned imports** - Import packages without versions
2. **No undefined Firestore writes** - Always define data structure
3. **Proper export/import patterns** - Consistent module structure
4. **Proper responsive design** - Mobile-first approach
5. **Type safety** - Use TypeScript properly
6. **Error handling** - Always handle errors gracefully
7. **No mock data in production code** - Only real data flows
8. **Consistent naming** - Follow established patterns
9. **Zero-bug prevention** - Test before commit

### Code Quality

- Write clean, readable code
- Comment complex logic
- Follow existing patterns
- Test locally before pushing
- No console.log in production code

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, test thoroughly

# Commit with clear message
git add .
git commit -m "feat: clear description"

# Push and create PR
git push origin feature/your-feature
```

---

**Document Version**: 1.0  
**Last Updated**: February 22, 2026  
**Maintained By**: VerSona Engineering Team

For issues or questions, refer to project documentation or contact the team.
