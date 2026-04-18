# 🚀 VerSona - Local Setup Guide (With File Templates)

## 📌 Goal

* Setup project from scratch
* Create required config files
* Fill missing values later
* Run app successfully

---

# 🧱 PHASE 1: INSTALLATION

## Install Tools

```bash
node -v
npm -v
```

If not installed → install Node.js (LTS)

---

# 📂 PHASE 2: PROJECT SETUP

## Install Dependencies

```bash
npm install
```

---

# 🔐 PHASE 3: REQUIRED FILES SETUP

👉 IMPORTANT: Create these files manually

---

## 📄 1. ENV FILE

📍 Path:

```
/.env
```

📄 Create file:

```env
# 🔐 Firebase Config
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# 🌐 Backend URLs
VITE_BACKEND_URL=http://localhost:8000
VITE_AI_BACKEND_URL=http://localhost:8001
```

👉 Fill values from Firebase Console

---

## 📄 2. FIREBASE CONFIG FILE

📍 Path:

```
/src/lib/firebase.ts
```

📄 Code:

```ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
```

---

## 📄 3. FIRESTORE RULES

📍 Path:

```
/firestore.rules
```

📄 Code:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    match /posts/{postId} {
      allow read, write: if request.auth != null;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📄 4. FIRESTORE INDEXES

📍 Path:

```
/firestore.indexes.json
```

📄 Code:

```json
{
  "indexes": [
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 📄 5. STORAGE RULES

📍 Path:

```
/storage.rules
```

📄 Code:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    match /uploads/{userId}/{fileName} {
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## 📄 6. BACKEND ENV FILE

📍 Path:

```
/backend-unified/.env
```

📄 Code:

```env
SECRET_KEY=

FIREBASE_CREDENTIALS_PATH=
FIREBASE_STORAGE_BUCKET=

GEMINI_API_KEY=

REDIS_HOST=
REDIS_PORT=
```

---

# ▶️ PHASE 4: RUN PROJECT

## Start Backend

```bash
cd backend-unified
python main.py
```

---

## Start Frontend

```bash
npm run dev
```

---

# 🔴 PHASE 5: REQUIRED FIXES

## 1. Replace alert()

📍 Files:

* SignupPage.tsx
* LoginPage.tsx

Replace:

```ts
alert("message")
```

With:

```ts
toast.success("message")
```

---

## 2. Chat Validation

📍 Path:

```
/src/lib/chatService.ts
```

Add:

```ts
if (message.length > 1000) {
  throw new Error("Message too long");
}
```

---

## 3. Chat Unique ID Fix

Use:

```ts
const chatId = [user1, user2].sort().join("_");
```

---

## 4. Global Error Handler

📍 Path:

```
/src/App.tsx
```

Add:

```ts
window.addEventListener("unhandledrejection", (e) => {
  console.error(e.reason);
});
```

---

## 5. Search Fix

📍 Path:

```
/src/components/SearchPage.tsx
```

Add:

```ts
const seen = new Set();
const uniqueResults = results.filter(r => {
  if (seen.has(r.id)) return false;
  seen.add(r.id);
  return true;
});
```

---

# 🧪 PHASE 6: TESTING

Test:

* Signup
* Login
* Search user
* Open profile
* Send message

---

# 🚀 PHASE 7: DEPLOYMENT

## Frontend:

* Vercel

## Backend:

* Render / Railway

Add same env variables there

---

# ✅ FINAL CHECK

* [ ] No crash
* [ ] Chat works
* [ ] Search works
* [ ] Profile works
* [ ] Firebase connected

---

# 🎯 FINAL RESULT

✅ Project runs locally
✅ Config files ready
✅ Missing values marked
✅ Ready for deployment

---

🔥 You now have a complete developer setup system.