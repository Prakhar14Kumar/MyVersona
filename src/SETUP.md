# 🚀 VerSona Setup Guide

Welcome to VerSona! This guide will help you set up your development environment.

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Firebase Project** (create one at [Firebase Console](https://console.firebase.google.com/))

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Step 2.1: Copy the example file
```bash
cp .env.example .env
```

#### Step 2.2: Get your Firebase credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **gear icon** ⚙️ → **Project settings**
4. Scroll down to **"Your apps"** section
5. Click on the **Web app** (</> icon)
6. Copy the config values

#### Step 2.3: Update your .env file

Open `.env` and replace the placeholder values:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Verify Your Setup

Run the environment checker:

```bash
npm run check-env
```

✅ **All checks passed?** You're ready to go!

❌ **Checks failed?** Follow the error messages to fix missing variables.

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app! 🎉

---

## 🔥 Firebase Setup

### Required Services

Enable these services in your Firebase Console:

#### 1. Authentication
- Go to **Authentication** → **Sign-in method**
- Enable **Email/Password**
- Enable **Google** (optional but recommended)

#### 2. Firestore Database
- Go to **Firestore Database** → **Create database**
- Choose **Test mode** for development
- Select your region

#### 3. Storage
- Go to **Storage** → **Get started**
- Choose **Test mode** for development

#### 4. Deploy Security Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Storage
# - Use existing project

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

#### 5. Create Firestore Indexes

The app requires composite indexes for efficient queries:

```bash
firebase deploy --only firestore:indexes
```

Or create them manually in Firebase Console when you see index errors.

---

## 🐍 Backend Setup (Optional)

If you want to use the Python FastAPI backend:

### 1. Install Python Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

### 2. Start Backend Server

```bash
python main.py
```

Backend will run on `http://localhost:8000`

### 3. Update Frontend Config

Ensure your `.env` has:

```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 📱 Development Workflow

### Run Development Server
```bash
npm run dev
```

### Type Check
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

---

## 🔒 Security Best Practices

### ⚠️ NEVER commit your .env file!

The `.env` file contains sensitive credentials and should **NEVER** be committed to version control.

✅ **Good:**
- Keep `.env` in your `.gitignore` (already configured)
- Use `.env.example` as a template
- Share credentials securely (1Password, LastPass, etc.)

❌ **Bad:**
- Committing `.env` to Git
- Hardcoding credentials in code
- Sharing credentials via chat/email

### Environment Variables in Production

For production deployment:

1. **Vercel/Netlify:** Add environment variables in dashboard
2. **Docker:** Use secrets or environment injection
3. **Cloud Run:** Use Secret Manager
4. **Heroku:** Use Config Vars

---

## 🐛 Troubleshooting

### Issue: "Missing required environment variable"

**Solution:** Make sure you copied `.env.example` to `.env` and filled in all values.

```bash
npm run check-env
```

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution:** Your Firebase API key is incorrect. Double-check it in Firebase Console.

### Issue: "FirebaseError: Missing or insufficient permissions"

**Solution:** You need to deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### Issue: "QUOTA_EXCEEDED" or "Resource exhausted"

**Solution:** You've hit Firebase free tier limits. Upgrade to Blaze plan or wait for quota reset.

### Issue: Build fails with TypeScript errors

**Solution:** Run type check to see specific errors:

```bash
npm run type-check
```

### Issue: "Cannot find module" errors

**Solution:** Clean install dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🆘 Need Help?

If you're stuck, check:

1. **Error logs** in browser console (F12)
2. **Firebase Console** for service status
3. **GitHub Issues** for known problems
4. **Documentation** linked above

---

## ✅ Setup Checklist

Use this checklist to ensure everything is configured:

- [ ] Node.js >= 18.0.0 installed
- [ ] npm >= 9.0.0 installed
- [ ] Firebase project created
- [ ] `.env` file created from `.env.example`
- [ ] All Firebase credentials added to `.env`
- [ ] `npm install` completed successfully
- [ ] `npm run check-env` passes
- [ ] Firebase Authentication enabled
- [ ] Firestore Database created
- [ ] Firebase Storage enabled
- [ ] Security rules deployed
- [ ] `npm run dev` starts successfully
- [ ] Can access app at http://localhost:5173

🎉 **All checked?** You're ready to build amazing things with VerSona!

---

**Version:** 2.0.0  
**Last Updated:** April 2, 2026
