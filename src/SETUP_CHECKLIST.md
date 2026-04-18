# ✅ VerSona Setup Checklist

Use this checklist to verify your local development environment is properly configured.

## 📋 Prerequisites

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```

- [ ] **npm 9+** installed
  ```bash
  npm --version  # Should show 9.0.0 or higher
  ```

- [ ] **Firebase account** created at [console.firebase.google.com](https://console.firebase.google.com/)

---

## 🔥 Firebase Project Setup

- [ ] Firebase project created
- [ ] **Authentication** enabled with Email/Password
- [ ] **Firestore Database** created (production mode)
- [ ] **Cloud Storage** enabled
- [ ] Web app registered in Firebase Console

---

## 🔐 Environment Variables Setup

- [ ] `.env.example` file exists in project root
- [ ] `.env` file created from `.env.example`:
  ```bash
  cp .env.example .env
  ```

- [ ] All Firebase credentials added to `.env`:
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`
  - [ ] `VITE_FIREBASE_MEASUREMENT_ID`

- [ ] Environment variables verified:
  ```bash
  npm run check-env
  ```
  Should show: `🎉 SUCCESS! All Firebase environment variables are configured correctly.`

---

## 📦 Dependencies Installation

- [ ] Node modules installed:
  ```bash
  npm install
  ```

- [ ] Installation completed without errors
- [ ] `node_modules/` directory exists

---

## 🚀 Development Server

- [ ] Dev server starts successfully:
  ```bash
  npm run dev
  ```

- [ ] Server running at `http://localhost:5173`

- [ ] Console shows success messages:
  - [ ] `[Firebase] ✅ App initialized successfully`
  - [ ] `[Analytics] 🎯 v1.1.0-fixed LOADED`

- [ ] **NO** error messages like:
  - ❌ `Missing required environment variable`
  - ❌ `Firebase: Error (auth/invalid-api-key)`
  - ❌ `Missing required Firebase configuration`

---

## 🔒 Firebase Security (Optional for Production)

- [ ] Security rules deployed:
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] Firestore indexes deployed:
  ```bash
  firebase deploy --only firestore:indexes
  ```

- [ ] Storage rules deployed:
  ```bash
  firebase deploy --only storage
  ```

---

## ✨ Feature Verification

After the dev server is running, verify these features work:

### Authentication
- [ ] Can navigate to signup page
- [ ] Can create a new account
- [ ] Can log in with created account
- [ ] User stays logged in after page refresh

### Core Features
- [ ] Feed page loads without errors
- [ ] Can create a new post
- [ ] Can search for users (if test users exist)
- [ ] Profile page loads
- [ ] Settings page accessible

### Console Checks
- [ ] No red errors in browser console
- [ ] No Firebase permission errors
- [ ] No undefined variable errors

---

## 🐛 Troubleshooting

### If you see Firebase errors:

1. **Check `.env` file exists:**
   ```bash
   ls -la .env
   ```

2. **Verify all variables are set:**
   ```bash
   npm run check-env
   ```

3. **Restart dev server** (required after changing `.env`):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

4. **Check Firebase Console** for correct credentials:
   - Settings → Project Settings → General
   - Scroll to "Your apps" → Web app
   - Verify config values match your `.env` file

### If features don't work:

1. **Check browser console** for errors (F12)
2. **Check network tab** for failed requests
3. **Verify Firebase Authentication** is enabled
4. **Verify Firestore Database** is created
5. **Check security rules** are not blocking requests

---

## 📚 Additional Resources

- **[ENV_SETUP_REQUIRED.md](./ENV_SETUP_REQUIRED.md)** - Quick env setup guide
- **[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)** - Complete Firebase setup
- **[README.md](./README.md)** - Project overview and documentation

---

## 🎉 Success!

When all items are checked, you're ready to develop!

**Next steps:**
1. Explore the codebase in `/components`
2. Try creating a post
3. Test the chat feature
4. Review the AI Career Assistant
5. Start building new features

---

**Need help?** Check the troubleshooting section or review the setup guides.
