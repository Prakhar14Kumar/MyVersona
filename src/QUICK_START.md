# 🚀 VerSona Quick Start Guide

Get VerSona running in **5 minutes**!

---

## ⚡ Super Quick Setup (For Testing)

The app now includes demo credentials so you can start immediately:

```bash
# 1. Install dependencies
npm install

# 2. Check environment
npm run check-env

# 3. Start the app
npm run dev
```

**⚠️ Important:** Demo credentials allow the app to start, but Firebase operations won't work. You'll see a warning banner.

---

## 🔥 Full Setup (For Real Usage)

To use the app with real Firebase:

### Step 1: Get Firebase Credentials (5 min)

1. Go to https://console.firebase.google.com/
2. Create a project or select existing one
3. Go to Project Settings (⚙️ icon)
4. Scroll to "Your apps" → Click Web icon (</>)
5. Copy the config values

### Step 2: Update Environment (2 min)

Open `/.env` and replace these lines:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### Step 3: Enable Firebase Services (3 min)

In Firebase Console:

1. **Authentication** → Enable Email/Password
2. **Firestore Database** → Create database (test mode)
3. **Storage** → Get started (test mode)

### Step 4: Verify & Launch

```bash
npm run check-env
npm run dev
```

✅ Visit http://localhost:5173

---

## 📚 Need More Help?

- **Full Setup:** Read `/SETUP.md`
- **Firebase Help:** Read `/FIREBASE_SETUP_INSTRUCTIONS.md`
- **Troubleshooting:** Check the guides above

---

## ✅ What Should Work Now

### With Demo Credentials:
- ✅ App starts and loads
- ✅ UI displays correctly
- ❌ Signup/Login won't work
- ❌ Database operations fail
- ⚠️ Warning banner appears

### With Real Credentials:
- ✅ Everything works!
- ✅ Signup/Login functional
- ✅ Posts, comments, likes work
- ✅ Real-time chat works
- ✅ File uploads work
- ✅ No warning banner

---

## 🐛 Common Issues

### "Missing environment variable"
**Fix:** Make sure `.env` file exists. Copy from `.env.example`

### "Firebase: Error (auth/invalid-api-key)"
**Fix:** Replace demo values in `.env` with real Firebase credentials

### "Network request failed"
**Fix:** Start the backend server: `cd python-backend && python main.py`

---

## 🎯 Next Steps

1. ✅ Get app running (you're here!)
2. 📖 Read full documentation
3. 🔥 Set up real Firebase
4. 🧪 Test all features
5. 🚀 Deploy to production

---

**Version:** 2.0.0  
**Updated:** April 2, 2026

Happy coding! 🎉
