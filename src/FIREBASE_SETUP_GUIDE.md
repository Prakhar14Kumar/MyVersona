# Firebase & Firestore Setup Guide for VerSona

## Overview

VerSona uses Firebase as its primary backend infrastructure for:

- **Firebase Authentication** - User signup, login, and session management
- **Cloud Firestore** - NoSQL database for users, posts, chats, notifications
- **Cloud Storage** - Profile pictures, post media, and resume uploads
- **Firebase Analytics** - User behavior tracking and engagement metrics

This guide provides step-by-step instructions to set up Firebase from scratch and configure it for VerSona.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create `.env` File

**CRITICAL:** Before running the app, you MUST create a `.env` file with your Firebase credentials.

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials (see Step 2 below)

3. **NEVER** commit `.env` to version control (already in `.gitignore`)

### Step 2: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project (or create a new one - see Section 1 below)
3. Click the gear icon → **Project Settings**
4. Scroll down to **"Your apps"** → Click the Web icon `</>`
5. Copy the values from `firebaseConfig` into your `.env` file:

```env
# .env file
VITE_FIREBASE_API_KEY=AIzaSyChMO4Zf1-UOfLcqTWIjMP68hBRdDoFLC8
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1096624482425
VITE_FIREBASE_APP_ID=1:1096624482425:web:11387f2f8991118f2b0ca8
VITE_FIREBASE_MEASUREMENT_ID=G-J8CB4FXNX9
```

### Step 3: Restart Dev Server

After creating `.env`, restart your development server:

```bash
npm run dev
```

✅ **You should see**: `[Firebase] ✅ App initialized successfully`  
❌ **If you see errors**: Check that all environment variables are set correctly

---

## 1. Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `versona-app` (or your preferred name)
4. **Disable** Google Analytics (optional - can be enabled later)
5. Click **"Create project"**
6. Wait for project creation to complete

### 1.2 Enable Firebase Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**
5. (Optional) Enable **Google Sign-in** if needed:
   - Click on "Google"
   - Toggle **"Enable"** to ON
   - Enter support email
   - Click **"Save"**

### 1.3 Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll deploy rules later)
4. Choose a **Cloud Firestore location**:
   - Recommended: `us-central1` or closest to your users
   - ⚠️ **Location cannot be changed later**
5. Click **"Enable"**
6. Wait for database creation (takes 1-2 minutes)

### 1.4 Enable Cloud Storage

1. In Firebase Console, go to **Build** → **Storage**
2. Click **"Get started"**
3. Click **"Next"** (accept default security rules)
4. Choose **same location** as Firestore
5. Click **"Done"**

---

## 2. Firebase Configuration

### 2.1 Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click the **Web** icon `</>`
4. Enter app nickname: `versona-web`
5. **Check** "Also set up Firebase Hosting" (optional)
6. Click **"Register app"**
7. Copy the `firebaseConfig` object

**Example Config:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyChMO4Zf1-UOfLcqTWIjMP68hBRdDoFLC8",
  authDomain: "versona-app.firebaseapp.com",
  projectId: "versona-app",
  storageBucket: "versona-app.firebasestorage.app",
  messagingSenderId: "1096624482425",
  appId: "1:1096624482425:web:11387f2f8991118f2b0ca8",
  measurementId: "G-J8CB4FXNX9"
};
```

### 2.2 Add Config to Project

The Firebase configuration is already integrated in `/lib/firebase.ts`. You have two options:

#### Option A: Use Environment Variables (Recommended for Production)

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyChMO4Zf1-UOfLcqTWIjMP68hBRdDoFLC8
VITE_FIREBASE_AUTH_DOMAIN=versona-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=versona-app
VITE_FIREBASE_STORAGE_BUCKET=versona-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1096624482425
VITE_FIREBASE_APP_ID=1:1096624482425:web:11387f2f8991118f2b0ca8
VITE_FIREBASE_MEASUREMENT_ID=G-J8CB4FXNX9

# Backend API URL
VITE_API_URL=http://localhost:8000
```

**Important:**
- Add `.env` to your `.gitignore`
- Never commit `.env` to version control
- Use environment variables in production

#### Option B: Use Hardcoded Config (Development Only)

The project already has fallback values in `/lib/firebase.ts`. Replace them with your config:

```typescript
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', "YOUR_API_KEY_HERE"),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "YOUR_AUTH_DOMAIN_HERE"),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', "YOUR_PROJECT_ID_HERE"),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "YOUR_STORAGE_BUCKET_HERE"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "YOUR_MESSAGING_SENDER_ID_HERE"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "YOUR_APP_ID_HERE"),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', "YOUR_MEASUREMENT_ID_HERE")
};
```

---

## 3. Firestore Database Structure

### 3.1 Collections Overview

VerSona uses the following Firestore collections:

```
versona-app (Firestore Database)
├── users/                    # User profiles
├── posts/                    # Social posts (text, images, videos)
├── chats/                    # Chat conversations
│   └── messages/            # Subcollection: chat messages
├── notifications/           # User notifications
├── stories/                 # 24-hour stories
├── comments/                # Post comments
├── bookmarks/               # Saved posts
├── communities/             # Community groups
├── colleges/                # College information
│   ├── members/            # Subcollection: college members
│   └── events/             # Subcollection: college events
├── events/                  # General events
├── feedback/                # User feedback
├── error_logs/              # Application error logs
└── analytics_events/        # User behavior analytics
```

### 3.2 Users Collection

**Collection:** `users`  
**Document ID:** User's Firebase Auth UID

**Required Fields:**
```typescript
{
  uid: string,              // Firebase Auth UID (same as document ID)
  email: string,            // User's email address
  displayName: string,      // User's display name
  username: string,         // Unique username (lowercase)
  username_lower: string,   // Lowercase username for search (REQUIRED)
  full_name_lower: string,  // Lowercase full name for search (REQUIRED)
  photoURL: string | null,  // Profile picture URL
  createdAt: Timestamp,     // Account creation date
  updatedAt: Timestamp      // Last update date
}
```

**Optional Fields:**
```typescript
{
  college: string,          // College/university name
  role: string,             // 'student' | 'recruiter' | 'alumni'
  year: string,             // Academic year (e.g., "2024", "2025")
  major: string,            // Field of study
  bio: string,              // User bio (max 500 chars)
  interests: string[],      // Array of interests/tags
  resumeURL: string,        // URL to uploaded resume
  skills: string[],         // Array of skills
  connections: number,      // Number of connections
  followers: number,        // Number of followers
  following: number         // Number of following
}
```

**Important:**
- `username_lower` and `full_name_lower` are **required** for search functionality
- These fields must be created during signup (see Authentication Flow)

### 3.3 Posts Collection

**Collection:** `posts`  
**Document ID:** Auto-generated

**Fields:**
```typescript
{
  userId: string,           // Author's user ID
  username: string,         // Author's username
  userAvatar: string,       // Author's profile picture
  content: string,          // Post text content
  mediaUrls: string[],      // Array of image/video URLs
  mediaType: string,        // 'text' | 'image' | 'video'
  likes: string[],          // Array of user IDs who liked
  likesCount: number,       // Number of likes
  comments: string[],       // Array of comment IDs
  commentsCount: number,    // Number of comments
  shares: string[],         // Array of user IDs who shared
  sharesCount: number,      // Number of shares
  bookmarks: string[],      // Array of user IDs who bookmarked
  feed_type: string,        // 'global' | 'college' | 'connections'
  userCollege: string,      // Author's college (for filtering)
  createdAt: Timestamp,     // Post creation timestamp
  updatedAt: Timestamp      // Last update timestamp
}
```

### 3.4 Chats Collection

**Collection:** `chats`  
**Document ID:** Auto-generated

**Fields:**
```typescript
{
  participants: string[],   // Array of user IDs (2 users)
  participantData: {        // Participant information
    [userId: string]: {
      displayName: string,
      photoURL: string,
      username: string
    }
  },
  lastMessage: string,      // Preview of last message
  lastMessageSenderId: string, // User ID of last message sender
  lastMessageTimestamp: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  unreadCount: {            // Unread count per user
    [userId: string]: number
  }
}
```

**Subcollection:** `chats/{chatId}/messages`

**Message Fields:**
```typescript
{
  sender_id: string,        // Sender's user ID
  receiver_id: string,      // Receiver's user ID
  content: string,          // Message text
  is_read: boolean,         // Read status
  createdAt: Timestamp,     // Message timestamp
  type: string              // 'text' | 'image' | 'file'
}
```

### 3.5 Notifications Collection

**Collection:** `notifications`  
**Document ID:** Auto-generated

**Fields:**
```typescript
{
  userId: string,           // Recipient's user ID (camelCase - IMPORTANT)
  actor_id: string,         // User who triggered the notification
  actor_username: string,   // Username of actor
  actor_avatar: string,     // Profile picture of actor
  type: string,             // 'like' | 'comment' | 'follow' | 'mention' | 'connection' | 'system'
  message: string,          // Notification text
  post_id: string,          // Related post ID (optional)
  is_read: boolean,         // Read status
  createdAt: Timestamp      // Notification timestamp
}
```

**Important:**
- Use `userId` (camelCase), NOT `user_id`
- Backend creates notifications with `userId` field
- Security rules check both `userId` and `user_id` for backward compatibility

---

## 4. Firestore Security Rules

### 4.1 Deploy Security Rules

The project includes production-ready security rules in `/firebase/firestore.rules`.

**To deploy:**

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select:
# - Firestore (security rules and indexes)
# - Use existing project: versona-app

# Deploy security rules
firebase deploy --only firestore:rules
```

### 4.2 Key Security Rules

**Users Collection:**
```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isOwner(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

**Posts Collection:**
```javascript
match /posts/{postId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && 
    (isOwner(resource.data.userId) || 
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likesCount', 'comments', 'commentsCount']));
  allow delete: if isAuthenticated() && isOwner(resource.data.userId);
}
```

**Notifications Collection:**
```javascript
match /notifications/{notificationId} {
  allow read: if isAuthenticated() && 
    (resource.data.userId == request.auth.uid || 
     resource.data.user_id == request.auth.uid);
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && 
    (resource.data.userId == request.auth.uid || 
     resource.data.user_id == request.auth.uid);
  allow delete: if isAuthenticated() && 
    (resource.data.userId == request.auth.uid || 
     resource.data.user_id == request.auth.uid);
}
```

### 4.3 Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

---

## 5. Firestore Indexes

### 5.1 Deploy Composite Indexes

The project includes required composite indexes in `/firebase/firestore.indexes.json`.

**To deploy:**

```bash
firebase deploy --only firestore:indexes
```

### 5.2 Required Indexes

**Posts Indexes:**
- `feed_type (ASC) + created_at (DESC)` - For feed filtering
- `userCollege (ASC) + createdAt (DESC)` - For college-specific feeds
- `userCollege (ASC) + likes (DESC)` - For trending posts

**Notifications Indexes:**
- `userId (ASC) + created_at (DESC)` - For user notifications
- `userId (ASC) + is_read (ASC) + created_at (DESC)` - For unread notifications

**Chats Indexes:**
- `participants (ARRAY_CONTAINS) + updatedAt (DESC)` - For user chat lists

**Users Indexes:**
- `username_lower (ASC)` - For username search
- `full_name_lower (ASC)` - For full name search

**Why Indexes are Required:**
- Firestore requires composite indexes for multi-field queries
- Missing indexes cause `failed-precondition` errors
- Indexes improve query performance significantly

---

## 6. Authentication Flow

### 6.1 User Signup Process

**File:** `/lib/firebaseAuth.ts`

**Flow:**
1. User submits email, password, and display name
2. `createUserWithEmailAndPassword()` creates Firebase Auth account
3. `updateProfile()` sets display name
4. User profile created in Firestore `users/{uid}` collection
5. User document includes:
   - `uid`, `email`, `displayName`, `photoURL`
   - `createdAt`, `updatedAt` timestamps
   - Search fields: `username_lower`, `full_name_lower`

**Code:**
```typescript
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Update display name
  if (displayName) {
    await updateProfile(firebaseUser, { displayName });
  }

  // 3. Create Firestore user profile
  const userProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || email,
    displayName: displayName || email.split('@')[0],
    photoURL: firebaseUser.photoURL || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 4. Save to Firestore
  await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

  return convertFirebaseUser(firebaseUser);
};
```

### 6.2 User Login Process

**Flow:**
1. User submits email and password
2. `signInWithEmailAndPassword()` authenticates user
3. Firebase Auth persists session
4. User data fetched from Firestore (if needed)

**Code:**
```typescript
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return convertFirebaseUser(userCredential.user);
};
```

### 6.3 Auth State Persistence

Firebase Auth automatically persists sessions using:
- **localStorage** (default) - Persists across browser sessions
- **sessionStorage** - Clears on browser close
- **none** - No persistence (only for current page)

**Auth state is monitored in:** `/hooks/useAuth.ts`

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      setUser(convertFirebaseUser(firebaseUser));
    } else {
      setUser(null);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

---

## 7. Storage Configuration

### 7.1 Storage Rules

**File:** `/firebase/storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile_pictures/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /post_media/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /resumes/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 7.2 Upload Example

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './lib/firebase';

async function uploadProfilePicture(userId: string, file: File) {
  const storageRef = ref(storage, `profile_pictures/${userId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
```

---

## 8. Common Errors & Fixes

### Error 1: Permission Denied

**Error:**
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

**Causes:**
- Security rules not deployed
- User not authenticated
- Querying data user doesn't own

**Fix:**
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Check authentication
console.log(auth.currentUser); // Should not be null

# Verify query matches security rules
```

### Error 2: Failed Precondition (Missing Index)

**Error:**
```
FirebaseError: [code=failed-precondition]: The query requires an index.
```

**Causes:**
- Composite index not created
- Indexes not deployed

**Fix:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Or click the link in the error message to auto-create index
```

### Error 3: Auth Not Persisting

**Symptom:**
- User logged out on page refresh
- Session not maintained

**Causes:**
- Browser blocking cookies/localStorage
- Incognito/private mode
- Auth persistence setting

**Fix:**
```typescript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Set persistence explicitly
await setPersistence(auth, browserLocalPersistence);
```

### Error 4: Config Not Working

**Symptom:**
- "Firebase: Error (auth/invalid-api-key)"
- "Firebase: No Firebase App '[DEFAULT]' has been created"

**Causes:**
- Incorrect Firebase config
- Environment variables not loaded
- Config not matching Firebase project

**Fix:**
1. Verify config in Firebase Console → Project Settings
2. Check `.env` file exists and has correct values
3. Restart dev server after changing `.env`
4. Ensure `VITE_` prefix on all environment variables

### Error 5: Data Not Showing in UI

**Symptom:**
- Users not appearing in search
- Posts not loading

**Causes:**
- Missing required fields (`username_lower`, `full_name_lower`)
- Incorrect query
- Permission denied

**Fix:**
```typescript
// Ensure search fields exist when creating user
const userProfile = {
  uid: firebaseUser.uid,
  email: email,
  displayName: displayName,
  username_lower: username.toLowerCase(),
  full_name_lower: displayName.toLowerCase(),
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

## 9. Testing Checklist

### 9.1 Authentication Tests

- [ ] User signup with email/password works
- [ ] User login with email/password works
- [ ] User stays logged in after page refresh
- [ ] User can log out successfully
- [ ] Password reset email sends correctly
- [ ] Invalid credentials show proper error messages

### 9.2 Firestore Tests

- [ ] User document created on signup
- [ ] User profile appears in Firestore Console
- [ ] User can create posts
- [ ] Posts appear in feed
- [ ] User can like/comment on posts
- [ ] Notifications created for interactions
- [ ] Chat messages save and load correctly

### 9.3 Search Tests

- [ ] User search by username works
- [ ] User search by full name works
- [ ] Search results appear instantly
- [ ] No permission-denied errors in console

### 9.4 Security Tests

- [ ] Unauthenticated users cannot read data
- [ ] Users cannot edit other users' posts
- [ ] Users cannot read other users' private data
- [ ] Security rules block unauthorized operations

### 9.5 Performance Tests

- [ ] Feed loads in under 2 seconds
- [ ] Search returns results in under 1 second
- [ ] Notifications update in real-time
- [ ] No console errors or warnings

---

## 10. Best Practices

### 10.1 Data Validation

**Always validate before writing:**
```typescript
// ❌ BAD: Writing undefined values
await setDoc(doc(db, 'users', uid), {
  uid: uid,
  email: email,
  displayName: displayName,
  photoURL: undefined // ❌ Will cause errors
});

// ✅ GOOD: Remove undefined values
const sanitizeData = (data) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
};

await setDoc(doc(db, 'users', uid), sanitizeData({
  uid: uid,
  email: email,
  displayName: displayName,
  photoURL: photoURL || null // ✅ Use null instead of undefined
}));
```

### 10.2 Avoid Duplicate Users

**Check username availability:**
```typescript
const usernameExists = async (username: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
```

### 10.3 Use Timestamps

**Always use Firebase Timestamp:**
```typescript
import { Timestamp } from 'firebase/firestore';

// ✅ GOOD: Use Firestore Timestamp
await setDoc(doc(db, 'posts', postId), {
  content: content,
  createdAt: Timestamp.now(), // Server timestamp
  updatedAt: Timestamp.now()
});

// ❌ BAD: Using JavaScript Date
await setDoc(doc(db, 'posts', postId), {
  content: content,
  createdAt: new Date() // Client timestamp (can be wrong)
});
```

### 10.4 Batch Operations

**Use batches for multiple writes:**
```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);

batch.set(doc(db, 'users', userId), userData);
batch.set(doc(db, 'notifications', notifId), notifData);
batch.update(doc(db, 'posts', postId), { likesCount: increment(1) });

await batch.commit(); // Atomic operation
```

### 10.5 Security in Production

**Production security rules:**
```javascript
// ❌ DEVELOPMENT: Too permissive
match /users/{userId} {
  allow read, write: if true;
}

// ✅ PRODUCTION: Strict permissions
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isOwner(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

### 10.6 Real-time Listeners

**Clean up listeners:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'posts')),
    (snapshot) => {
      const posts = snapshot.docs.map(doc => doc.data());
      setPosts(posts);
    }
  );

  // ✅ IMPORTANT: Cleanup on unmount
  return () => unsubscribe();
}, []);
```

### 10.7 Error Handling

**Always handle errors:**
```typescript
try {
  await setDoc(doc(db, 'users', uid), userData);
} catch (error: any) {
  if (error.code === 'permission-denied') {
    console.error('Permission denied - check security rules');
  } else if (error.code === 'unavailable') {
    console.error('Firestore unavailable - check network');
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## 11. Production Deployment

### 11.1 Pre-deployment Checklist

- [ ] Environment variables set in production
- [ ] Security rules deployed
- [ ] Composite indexes deployed
- [ ] Storage rules configured
- [ ] Firebase Analytics enabled
- [ ] Error logging configured
- [ ] All tests passing

### 11.2 Deploy Commands

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
firebase deploy --only hosting
```

### 11.3 Monitor in Production

**Firebase Console → Analytics:**
- Active users
- User engagement
- Error rates
- Performance metrics

**Firestore Console:**
- Read/write operations
- Storage usage
- Query performance

---

## 12. Support & Resources

### Official Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage](https://firebase.google.com/docs/storage)

### Project Files

- `/lib/firebase.ts` - Firebase initialization
- `/lib/firebaseAuth.ts` - Authentication service
- `/lib/firestoreService.ts` - Firestore operations
- `/firebase/firestore.rules` - Security rules
- `/firebase/firestore.indexes.json` - Composite indexes
- `/firebase/storage.rules` - Storage security rules

### Common Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# View logs
firebase functions:log

# Open Firebase Console
firebase open
```

---

## Summary

✅ **Firebase project created**  
✅ **Authentication enabled**  
✅ **Firestore database configured**  
✅ **Security rules deployed**  
✅ **Composite indexes created**  
✅ **Storage configured**  
✅ **Environment variables set**  

Your VerSona Firebase setup is complete! The app should now be fully functional with real-time data synchronization, secure authentication, and optimized queries.

For issues or questions, refer to the [Common Errors](#8-common-errors--fixes) section or check the Firebase Console logs.