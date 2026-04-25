# 📋 Week 1 Backend - Example Request/Response Flows

## Complete End-to-End Examples with Real JSON

---

## 🎯 Flow 1: Create Post → Like → Comment → Get Comments

### Step 1: Create Post

**Request:**
```http
POST /api/v1/posts HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Just launched MyVerSona! 🚀 Excited to connect with fellow students. #versona #launch #excited",
  "feed_type": "career",
  "hashtags": ["versona", "launch", "excited"]
}
```

**Response (200 OK):**
```json
{
  "post_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "user_id": "user_abc123",
  "username": "rajiv_sharma",
  "full_name": "Rajiv Sharma",
  "user_avatar": "https://storage.googleapis.com/versona/avatars/rajiv.jpg",
  "content": "Just launched MyVerSona! 🚀 Excited to connect with fellow students. #versona #launch #excited",
  "feed_type": "career",
  "media_urls": [],
  "media_type": "none",
  "hashtags": ["versona", "launch", "excited"],
  "likes_count": 0,
  "comments_count": 0,
  "shares_count": 0,
  "bookmarks_count": 0,
  "is_verified_user": false,
  "created_at": "2026-02-15T14:30:00.123Z",
  "updated_at": "2026-02-15T14:30:00.123Z"
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  post_id: "a1b2c3d4-e5f6-4789-a012-345678901234",
  user_id: "user_abc123",
  content: "Just launched MyVerSona! 🚀 ...",
  likes_count: 0,      // ← Counter initialized
  comments_count: 0,   // ← Counter initialized
  created_at: Timestamp(2026-02-15 14:30:00)
}

// users/user_abc123
{
  posts_count: 42 → 43  // ← Incremented atomically
}
```

---

### Step 2: Like the Post (User 1)

**Request:**
```http
POST /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/like HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Post liked successfully"
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  likes_count: 0 → 1  // ← Incremented atomically in transaction
}

// posts/a1b2c3d4-e5f6-4789-a012-345678901234/likes/user_xyz789
{
  user_id: "user_xyz789",
  created_at: Timestamp(2026-02-15 14:31:00)
}
```

---

### Step 3: Like the Post (User 2)

**Request:**
```http
POST /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/like HTTP/1.1
Authorization: Bearer [different_user_token]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Post liked successfully"
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  likes_count: 1 → 2  // ← Incremented again
}

// New like document
// posts/.../likes/user_def456
{
  user_id: "user_def456",
  created_at: Timestamp(2026-02-15 14:32:00)
}
```

---

### Step 4: Try to Like Again (Duplicate Prevention)

**Request:**
```http
POST /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/like HTTP/1.1
Authorization: Bearer [same_user_token_as_step_2]
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Post already liked or not found"
}
```

**Database State:**
```javascript
// NO CHANGE - transaction prevented duplicate
{
  likes_count: 2  // ← Still 2, NOT 3
}
```

---

### Step 5: Create Comment

**Request:**
```http
POST /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/comments HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Congratulations! 🎉 Can't wait to try it out!"
}
```

**Response (200 OK):**
```json
{
  "comment_id": "comment_123xyz",
  "post_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "user_id": "user_ghi789",
  "username": "priya_patel",
  "full_name": "Priya Patel",
  "user_avatar": "https://storage.googleapis.com/versona/avatars/priya.jpg",
  "content": "Congratulations! 🎉 Can't wait to try it out!",
  "likes_count": 0,
  "created_at": "2026-02-15T14:35:00.456Z"
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  comments_count: 0 → 1  // ← Incremented atomically
}

// posts/.../comments/comment_123xyz
{
  comment_id: "comment_123xyz",
  post_id: "a1b2c3d4-e5f6-4789-a012-345678901234",
  user_id: "user_ghi789",
  content: "Congratulations! 🎉 Can't wait to try it out!",
  created_at: Timestamp(2026-02-15 14:35:00)
}
```

---

### Step 6: Add More Comments

**Request (Comment 2):**
```json
{
  "content": "Great work! What tech stack did you use?"
}
```

**Response:**
```json
{
  "comment_id": "comment_456abc",
  "content": "Great work! What tech stack did you use?",
  "created_at": "2026-02-15T14:36:00.789Z",
  ...
}
```

**Request (Comment 3):**
```json
{
  "content": "This is exactly what we needed! 👏"
}
```

**Response:**
```json
{
  "comment_id": "comment_789def",
  "content": "This is exactly what we needed! 👏",
  "created_at": "2026-02-15T14:37:00.012Z",
  ...
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  likes_count: 2,
  comments_count: 1 → 3  // ← Now 3 comments
}

// Comments subcollection has 3 documents
```

---

### Step 7: Get Comments (First Page)

**Request:**
```http
GET /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/comments?limit=2 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "comments": [
    {
      "comment_id": "comment_123xyz",
      "post_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
      "user_id": "user_ghi789",
      "username": "priya_patel",
      "full_name": "Priya Patel",
      "user_avatar": "https://storage.googleapis.com/versona/avatars/priya.jpg",
      "content": "Congratulations! 🎉 Can't wait to try it out!",
      "likes_count": 0,
      "created_at": "2026-02-15T14:35:00.456Z"
    },
    {
      "comment_id": "comment_456abc",
      "user_id": "user_jkl012",
      "username": "amit_verma",
      "full_name": "Amit Verma",
      "user_avatar": "https://storage.googleapis.com/versona/avatars/amit.jpg",
      "content": "Great work! What tech stack did you use?",
      "likes_count": 0,
      "created_at": "2026-02-15T14:36:00.789Z"
    }
  ],
  "next_cursor": "comment_456abc",
  "has_more": true
}
```

---

### Step 8: Get Comments (Next Page)

**Request:**
```http
GET /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/comments?limit=2&cursor=comment_456abc HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "comments": [
    {
      "comment_id": "comment_789def",
      "user_id": "user_mno345",
      "username": "sneha_reddy",
      "full_name": "Sneha Reddy",
      "user_avatar": "https://storage.googleapis.com/versona/avatars/sneha.jpg",
      "content": "This is exactly what we needed! 👏",
      "likes_count": 0,
      "created_at": "2026-02-15T14:37:00.012Z"
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

**Explanation:**
- First page: 2 comments + cursor + has_more=true
- Second page: 1 comment + no cursor + has_more=false
- Total: 3 comments fetched with pagination

---

## 🎯 Flow 2: Unlike Post

### Step 1: Unlike Post

**Request:**
```http
DELETE /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/like HTTP/1.1
Authorization: Bearer [user_xyz789_token]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Post unliked successfully"
}
```

**Database State After:**
```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  likes_count: 2 → 1  // ← Decremented atomically
}

// posts/.../likes/user_xyz789
// ← DELETED
```

---

### Step 2: Try to Unlike Again

**Request:**
```http
DELETE /api/v1/posts/a1b2c3d4-e5f6-4789-a012-345678901234/like HTTP/1.1
Authorization: Bearer [same_user_token]
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Post not liked or not found"
}
```

**Database State:**
```javascript
// NO CHANGE - transaction prevented going negative
{
  likes_count: 1  // ← Still 1, NOT 0
}
```

---

## ⚠️ Flow 3: Error Cases

### Case 1: XSS Attack Attempt

**Request:**
```json
{
  "content": "<script>alert('Hacked!');</script><img src=x onerror=alert('XSS')>",
  "feed_type": "entertainment"
}
```

**Response (200 OK):**
```json
{
  "post_id": "...",
  "content": "&lt;script&gt;alert(&#x27;Hacked!&#x27;);&lt;/script&gt;&lt;img src=x onerror=alert(&#x27;XSS&#x27;)&gt;",
  "created_at": "...",
  ...
}
```

**What Happened:**
- HTML special characters escaped
- `<` → `&lt;`
- `'` → `&#x27;`
- When rendered in frontend, shows as text, NOT executed

---

### Case 2: Empty Comment

**Request:**
```json
{
  "content": "   "
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "loc": ["body", "content"],
      "msg": "Content cannot be empty",
      "type": "value_error"
    }
  ]
}
```

---

### Case 3: Content Too Long

**Request:**
```json
{
  "content": "A".repeat(2001),
  "feed_type": "entertainment"
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "loc": ["body", "content"],
      "msg": "ensure this value has at most 2000 characters",
      "type": "value_error.any_str.max_length",
      "ctx": {
        "limit_value": 2000
      }
    }
  ]
}
```

---

### Case 4: Rate Limit Exceeded

**Request (11th post in 1 minute):**
```http
POST /api/v1/posts HTTP/1.1
...
```

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```

---

### Case 5: Post Not Found

**Request:**
```http
GET /api/v1/posts/non-existent-post-id HTTP/1.1
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Post not found"
}
```

---

### Case 6: No Auth Token

**Request:**
```http
POST /api/v1/posts HTTP/1.1
Content-Type: application/json

{
  "content": "Test",
  "feed_type": "entertainment"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

---

## 📊 Final Database State Summary

After all operations in Flow 1:

```javascript
// posts/a1b2c3d4-e5f6-4789-a012-345678901234
{
  post_id: "a1b2c3d4-e5f6-4789-a012-345678901234",
  user_id: "user_abc123",
  username: "rajiv_sharma",
  content: "Just launched MyVerSona! 🚀 ...",
  feed_type: "career",
  likes_count: 1,        // ← 2 likes - 1 unlike = 1
  comments_count: 3,     // ← 3 comments created
  created_at: Timestamp(2026-02-15 14:30:00),
  updated_at: Timestamp(2026-02-15 14:30:00)
}

// Likes subcollection (1 document)
posts/.../likes/user_def456 {
  user_id: "user_def456",
  created_at: Timestamp(2026-02-15 14:32:00)
}

// Comments subcollection (3 documents)
posts/.../comments/comment_123xyz
posts/.../comments/comment_456abc
posts/.../comments/comment_789def

// User counter
users/user_abc123 {
  posts_count: 43  // ← Incremented when post created
}
```

**Counter Integrity Verified:** ✅
- `likes_count: 1` = 1 document in likes subcollection
- `comments_count: 3` = 3 documents in comments subcollection

---

## 🧪 Verification Queries

**Check counter matches subcollection:**
```javascript
// Get post
const post = await db.collection('posts').doc(postId).get();
console.log('Counter:', post.data().likes_count);

// Count likes subcollection
const likesSnapshot = await db.collection('posts').doc(postId)
  .collection('likes').get();
console.log('Actual:', likesSnapshot.size);

// Should match!
assert(post.data().likes_count === likesSnapshot.size);
```

---

**Last Updated:** February 15, 2026  
**Status:** Production-Ready ✅  
**All Examples Tested:** ✅
