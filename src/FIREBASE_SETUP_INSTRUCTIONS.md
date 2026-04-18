# 🔥 Firebase Setup Instructions for VerSona

## ⚠️ IMPORTANT: You Must Replace Demo Credentials

The `.env` file currently contains **demo/placeholder values**. These will NOT work for a real application. You must replace them with your actual Firebase credentials.

---

## 📝 Step-by-Step Guide

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name: `versona-app` (or your preferred name)
4. Enable/Disable Google Analytics (recommended: enable)
5. Click **"Create project"**

### Step 2: Get Your Firebase Credentials

1. In Firebase Console, click the **⚙️ gear icon** → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **</>** (Web) icon to add a web app
4. Register your app:
   - App nickname: `VerSona Web`
   - ✓ Check "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**

5. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_Rm7hXX6yYQp1234567890abcdefghij",
  authDomain: "versona-app.firebaseapp.com",
  projectId: "versona-app",
  storageBucket: "versona-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456789",
  measurementId: "G-ABC123XYZ"
};
```

### Step 3: Update Your .env File

Open your `.env` file and replace the placeholder values:

```env
# Replace these with YOUR actual values from Firebase Console
VITE_FIREBASE_API_KEY=AIzaSyC_Rm7hXX6yYQp1234567890abcdefghij
VITE_FIREBASE_AUTH_DOMAIN=versona-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=versona-app
VITE_FIREBASE_STORAGE_BUCKET=versona-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456789
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

### Step 4: Enable Firebase Services

#### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable these providers:
   - ✅ **Email/Password** - Click enable, then save
   - ✅ **Google** (recommended) - Click enable, enter support email, save

#### Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. **Start in test mode** (we'll deploy security rules later)
4. Choose your Cloud Firestore location (choose closest to your users)
   - Recommended for India: `asia-south1` (Mumbai)
5. Click **"Enable"**

#### Enable Storage

1. In Firebase Console, go to **Storage**
2. Click **"Get started"**
3. **Start in test mode** (we'll deploy security rules later)
4. Use the same location as Firestore
5. Click **"Done"**

### Step 5: Deploy Security Rules

⚠️ **CRITICAL:** Test mode allows anyone to read/write. Deploy security rules ASAP!

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Storage
# Use arrow keys, space to select, enter to confirm

# Choose "Use an existing project"
# Select your project from the list

# Accept default file names:
# - Firestore Rules: firebase/firestore.rules
# - Firestore Indexes: firebase/firestore.indexes.json
# - Storage Rules: firebase/storage.rules

# Deploy everything
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Step 6: Verify Your Setup

Run the environment checker:

```bash
npm run check-env
```

You should see:
```
✓ All checks passed! Your environment is properly configured.
```

### Step 7: Test the App

```bash
npm run dev
```

Visit `http://localhost:5173` and try:
1. **Sign up** with email/password
2. **Login** with your new account
3. **Create a post**
4. **Search for users**

If everything works, congratulations! 🎉

---

## 🔒 Security Checklist

- [ ] Replaced all demo values in `.env`
- [ ] `.env` is in `.gitignore` (already configured)
- [ ] Never committed `.env` to Git
- [ ] Deployed Firestore security rules
- [ ] Deployed Storage security rules
- [ ] Enabled Email/Password authentication
- [ ] Set up authentication providers
- [ ] Database is NOT in test mode (or rules deployed)
- [ ] Storage is NOT in test mode (or rules deployed)

---

## 🚨 Common Errors & Solutions

### Error: "Firebase: Error (auth/invalid-api-key)"

**Cause:** Your API key is wrong or still using demo value

**Solution:**
1. Double-check your API key in Firebase Console
2. Make sure you copied it correctly (no extra spaces)
3. Restart your dev server after changing `.env`

### Error: "Missing or insufficient permissions"

**Cause:** Firestore security rules haven't been deployed

**Solution:**
```bash
firebase deploy --only firestore:rules
```

### Error: "Index is required for this query"

**Cause:** Firestore needs a composite index

**Solution:**
1. Click the link in the error message (creates index automatically)
2. Or deploy indexes: `firebase deploy --only firestore:indexes`
3. Wait 2-3 minutes for index to build

### Warning: "Using demo/placeholder value"

**Cause:** You haven't replaced demo values in `.env`

**Solution:**
1. Open `.env` file
2. Replace all values starting with `versona-demo`, `AIzaSyDEMO`, etc.
3. Use your actual Firebase credentials

### Error: "Network request failed"

**Cause:** Backend URL is wrong or server isn't running

**Solution:**
1. Check `VITE_BACKEND_URL` in `.env`
2. Make sure it's `http://localhost:8000` for local development
3. Start the Python backend if needed

---

## 💡 Tips

### For Development

- Use **Test mode** for Firestore/Storage during development
- Deploy security rules once you're ready to test with real users
- Monitor Firebase Console → Usage tab to track quota

### For Production

- Switch to **Production rules** (already in `/firebase/firestore.rules`)
- Deploy: `firebase deploy --only firestore:rules,storage`
- Set up Firebase App Check to prevent abuse
- Monitor Firebase Console → Analytics

### Free Tier Limits

Firebase Spark (Free) plan includes:
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Storage: 1GB storage, 10GB/month transfer
- Authentication: Unlimited

For VerSona in production, you'll likely need **Blaze Plan** (pay-as-you-go).

---

## 📞 Need Help?

1. **Firebase Status:** https://status.firebase.google.com/
2. **Firebase Docs:** https://firebase.google.com/docs
3. **Stack Overflow:** Tag questions with `firebase` and `vite`
4. **Check console logs** in browser (F12) for specific error messages

---

## ✅ Quick Validation

After setup, verify these work:

```bash
# 1. Environment variables are set
npm run check-env

# 2. TypeScript compiles
npm run type-check

# 3. App builds
npm run build

# 4. App runs
npm run dev
```

All passing? You're ready to develop! 🚀

---

**Last Updated:** April 2, 2026  
**VerSona Version:** 2.0.0
