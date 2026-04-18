# VerSona - Local Development Setup

## ✅ Quick Start (5 Minutes)

### Prerequisites
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Firebase Account** ([Create](https://console.firebase.google.com/))

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Firebase credentials
# Get these from: https://console.firebase.google.com/
```

**Required Firebase Configuration:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Optional (defaults work for local development):**
```env
VITE_API_URL=http://localhost:8000
VITE_PYTHON_API_URL=http://localhost:8001
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Build for Production

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

---

## 📁 Project Structure

```
versona/
├── components/        # React components
│   ├── ui/           # UI components (buttons, dialogs, etc.)
│   └── ...           # Page components
├── lib/              # Utilities and services
│   ├── firebase.ts   # Firebase setup
│   ├── config.ts     # Environment configuration
│   └── ...           # Other services
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── types/            # TypeScript types
├── styles/           # Global styles
│   └── globals.css   # Tailwind CSS + custom styles
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.html        # HTML template
```

---

## 🔥 Firebase Setup (First Time Only)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "versona-dev")
4. Disable Google Analytics (optional)
5. Create project

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Save

### 3. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create Database"
3. Choose **Test Mode** (for development)
4. Select region (e.g., us-central)
5. Create

### 4. Enable Storage

1. Go to **Build** → **Storage**
2. Click "Get Started"
3. Use default security rules
4. Done

### 5. Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app (name: "VerSona Web")
5. Copy the config values to your `.env` file

---

## ⚠️ Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Firebase not initialized" error

- Make sure `.env` file exists
- Check that all Firebase variables are filled in
- Restart dev server: `Ctrl+C` then `npm run dev`

### Port 5173 already in use

```bash
# Kill the process using the port
# On macOS/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### TypeScript errors

```bash
# Run type check to see all errors
npm run type-check
```

### Build fails

```bash
# Check for TypeScript errors
npm run type-check

# Check for linting issues
npm run lint
```

---

## 🚀 Next Steps

1. **Backend Setup:** See `/backend/README.md` for API setup
2. **AI Backend:** See `/python-backend/README.md` for ML models setup
3. **Demo Data:** Run `python scripts/seed-demo-data.py` to add demo users/posts
4. **Deployment:** See `/DEPLOYMENT_URLS.md` for deployment instructions

---

## 📚 Documentation

- **[Technical Status Report](/VERSONA_TECHNICAL_STATUS_REPORT.md)** - Complete project status
- **[Final Checklist](/FINAL_CHECKLIST.md)** - 5-day completion plan
- **[Demo Script](/DEMO_SCRIPT.md)** - Presentation walkthrough
- **[API Reference](/backend/API_REFERENCE.md)** - Backend API docs

---

## 💡 Development Tips

### Hot Module Replacement (HMR)
- Changes to `.tsx` files auto-reload
- Changes to `.css` files update instantly
- No need to refresh browser

### Environment Variables
- Prefix all env vars with `VITE_`
- Restart dev server after changing `.env`
- Never commit `.env` file (only `.env.example`)

### Code Quality
- Run `npm run lint` before committing
- Run `npm run type-check` to catch TypeScript errors
- Use ESLint auto-fix: `npm run lint -- --fix`

### Performance
- Lazy load pages (already implemented)
- Use `React.memo()` for expensive components
- Check bundle size: `npm run build` and check `dist/` folder

---

## 🐛 Known Issues

### Firebase Warnings
- "Analytics not initialized" - Safe to ignore if not using Analytics
- Firestore warnings about indexes - Deploy indexes: `firebase deploy --only firestore:indexes`

### Build Warnings
- Unused imports - Run `npm run lint -- --fix` to auto-remove
- Missing types - Add proper TypeScript types

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] Node.js >= 18 installed (`node --version`)
- [ ] npm >= 9 installed (`npm --version`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created with Firebase config
- [ ] Dev server starts (`npm run dev` works)
- [ ] App loads at http://localhost:5173
- [ ] No console errors in browser DevTools

---

**Questions?** Check the documentation or review the code - it's well-commented!

**Ready to deploy?** See [DEPLOYMENT_URLS.md](/DEPLOYMENT_URLS.md)
