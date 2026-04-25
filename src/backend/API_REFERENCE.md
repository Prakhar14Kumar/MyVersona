# 📘 MyVerSona Backend API Reference - Week 1

**Base URL:** `http://localhost:8000` (dev) | `https://api.versona.app` (prod)  
**Version:** 1.0.0  
**Authentication:** Bearer token required on all endpoints

---

## 🔐 Authentication

All endpoints require Bearer token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token from:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`

---

## 📝 Posts API

### 1. Create Post

**Endpoint:** `POST /api/v1/posts`

**Rate Limit:** 10 requests/minute

**Request:**
```json
{
  "content": "Hello MyVerSona! #firstpost",
  "feed_type": "entertainment",
  "hashtags": ["firstpost"],
  "media_urls": [],
  "media_type": "none"
}
```

**Validation:**
- `content`: 1-2000 characters, XSS sanitized
- `feed_type`: "entertainment" | "career"
- `hashtags`: max 10 tags

**Response (200):**
```json
{
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "username": "john_doe",
  "full_name": "John Doe",
  "user_avatar": "https://...",
  "content": "Hello MyVerSona! #firstpost",
  "feed_type": "entertainment",
  "hashtags": ["firstpost"],
  "likes_count": 0,
  "comments_count": 0,
  "shares_count": 0,
  "bookmarks_count": 0,
  "is_verified_user": false,
  "created_at": "2026-02-15T10:30:00.000Z",
  "updated_at": "2026-02-15T10:30:00.000Z"
}
```

**Errors:**
- `422`: Validation error (empty, too long, invalid type)
- `401`: Not authenticated
- `429`: Rate limit exceeded (>10/min)
- `500`: Server error

---

### 2. Get Feed

**Endpoint:** `GET /api/v1/posts/feed/{feed_type}`

**Rate Limit:** 100 requests/minute

**Parameters:**
- `feed_type` (path): "entertainment" | "career"
- `limit` (query): 1-50, default 20
- `last_post_id` (query): cursor for pagination

**Example:**
```
GET /api/v1/posts/feed/entertainment?limit=20&last_post_id=abc123
```

**Response (200):**
```json
[
  {
    "post_id": "...",
    "content": "...",
    "likes_count": 42,
    "comments_count": 8,
    "created_at": "...",
    ...
  },
  ...
]
```

**Pagination:**
1. First page: `GET /feed/entertainment?limit=20`
2. Next page: Use last post's `post_id` as cursor
3. Continue until empty array returned

---

### 3. Get Single Post

**Endpoint:** `GET /api/v1/posts/{post_id}`

**Response (200):**
```json
{
  "post_id": "...",
  "content": "...",
  "likes_count": 42,
  ...
}
```

**Errors:**
- `404`: Post not found
- `401`: Not authenticated

---

### 4. Like Post

**Endpoint:** `POST /api/v1/posts/{post_id}/like`

**Rate Limit:** 60 requests/minute

**No request body required**

**Response (200):**
```json
{
  "success": true,
  "message": "Post liked successfully"
}
```

**Behavior:**
- ✅ Creates like document in `posts/{post_id}/likes/{user_id}`
- ✅ Increments `likes_count` atomically
- ✅ Prevents duplicate likes (transaction)

**Errors:**
- `400`: Already liked or post not found
- `401`: Not authenticated
- `429`: Rate limit exceeded (>60/min)

**Database Changes:**
```
Before: likes_count = 5
After:  likes_count = 6
        + likes/{user_id} document created
```

---

### 5. Unlike Post

**Endpoint:** `DELETE /api/v1/posts/{post_id}/like`

**Rate Limit:** 60 requests/minute

**No request body required**

**Response (200):**
```json
{
  "success": true,
  "message": "Post unliked successfully"
}
```

**Behavior:**
- ✅ Deletes like document from subcollection
- ✅ Decrements `likes_count` atomically
- ✅ Validates like exists (transaction)

**Errors:**
- `400`: Not liked or post not found
- `401`: Not authenticated

**Database Changes:**
```
Before: likes_count = 6
After:  likes_count = 5
        + likes/{user_id} document deleted
```

---

### 6. Create Comment

**Endpoint:** `POST /api/v1/posts/{post_id}/comments`

**Rate Limit:** 60 requests/minute

**Request:**
```json
{
  "content": "Great post! Very helpful."
}
```

**Validation:**
- `content`: 1-500 characters, XSS sanitized

**Response (200):**
```json
{
  "comment_id": "660e8400-e29b-41d4-a716-446655440000",
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "username": "john_doe",
  "full_name": "John Doe",
  "user_avatar": "https://...",
  "content": "Great post! Very helpful.",
  "likes_count": 0,
  "created_at": "2026-02-15T10:35:00.000Z"
}
```

**Behavior:**
- ✅ Creates comment document
- ✅ Increments `comments_count` atomically
- ✅ XSS sanitization applied

**Errors:**
- `422`: Validation error (empty, too long)
- `404`: Post not found
- `401`: Not authenticated

---

### 7. Get Comments

**Endpoint:** `GET /api/v1/posts/{post_id}/comments`

**Rate Limit:** 100 requests/minute

**Parameters:**
- `limit` (query): 1-100, default 20
- `cursor` (query): comment_id for pagination

**Example:**
```
GET /api/v1/posts/{post_id}/comments?limit=20&cursor=abc123
```

**Response (200):**
```json
{
  "comments": [
    {
      "comment_id": "...",
      "content": "Great post!",
      "user_id": "...",
      "username": "...",
      "created_at": "...",
      ...
    },
    ...
  ],
  "next_cursor": "def456",
  "has_more": true
}
```

**Pagination:**
- Ordered by `created_at` ASC (oldest first)
- Use `next_cursor` for next page
- `has_more: false` means last page

**Example Flow:**
```
1. GET /comments?limit=20
   → Returns 20 comments + next_cursor="xyz789"

2. GET /comments?limit=20&cursor=xyz789
   → Returns next 20 comments + next_cursor="abc123"

3. GET /comments?limit=20&cursor=abc123
   → Returns 5 comments, has_more=false, next_cursor=null
```

---

## 🔄 Update & Delete

### 8. Update Post

**Endpoint:** `PUT /api/v1/posts/{post_id}`

**Request:**
```json
{
  "content": "Updated content",
  "hashtags": ["new", "tags"]
}
```

**Only allows updating:**
- `content` (1-2000 chars, XSS sanitized)
- `hashtags` (max 10)

**Response (200):** Updated post object

**Errors:**
- `403`: Not post owner
- `404`: Post not found

---

### 9. Delete Post

**Endpoint:** `DELETE /api/v1/posts/{post_id}`

**Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**Behavior:**
- ✅ Deletes post document
- ✅ Decrements user's `posts_count`
- ❌ Does NOT cascade delete likes/comments (by design)

**Errors:**
- `403`: Not post owner
- `404`: Post not found

---

## ⚠️ Error Responses

All errors follow this structure:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Post created |
| 400 | Bad Request | Already liked |
| 401 | Unauthorized | Invalid token |
| 403 | Forbidden | Not post owner |
| 404 | Not Found | Post doesn't exist |
| 422 | Validation Error | Content too long |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Internal error |

**Note:** 500 errors never expose internal details in production.

---

## 🚦 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 5 | 1 minute |
| Create post | 10 | 1 minute |
| Like/Unlike | 60 | 1 minute |
| Comments | 60 | 1 minute |
| Get/Read | 100 | 1 minute |

**Rate limit response (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## 🔒 Security Features

### 1. XSS Protection
All user input is HTML-escaped:
```
Input:  <script>alert('xss')</script>
Stored: &lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;
```

### 2. Input Validation
- Content length limits enforced
- Feed type enum validated
- Hashtag count limited
- Pydantic validators on all inputs

### 3. Authentication
- Bearer token required on all endpoints
- Token validated on every request
- User identity checked for ownership

### 4. CORS
- Restricted to specific domains
- No wildcard in production
- Credentials allowed

---

## 📊 Database Schema

### Posts Collection
```javascript
posts/{post_id}
{
  post_id: string,
  user_id: string,
  username: string,
  content: string,
  feed_type: "entertainment" | "career",
  likes_count: number,      // Atomic counter
  comments_count: number,   // Atomic counter
  created_at: timestamp,
  updated_at: timestamp
}
```

### Likes Subcollection
```javascript
posts/{post_id}/likes/{user_id}
{
  user_id: string,
  created_at: timestamp
}
```

### Comments Subcollection
```javascript
posts/{post_id}/comments/{comment_id}
{
  comment_id: string,
  post_id: string,
  user_id: string,
  username: string,
  content: string,
  likes_count: number,
  created_at: timestamp
}
```

---

## 🧪 Testing Examples

### Using cURL

**Create Post:**
```bash
curl -X POST http://localhost:8000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World!",
    "feed_type": "entertainment"
  }'
```

**Like Post:**
```bash
curl -X POST http://localhost:8000/api/v1/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Comments:**
```bash
curl http://localhost:8000/api/v1/posts/POST_ID/comments?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript/Fetch

```javascript
// Create post
const response = await fetch('http://localhost:8000/api/v1/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Hello World!',
    feed_type: 'entertainment'
  })
});

const post = await response.json();
console.log(post.post_id);
```

---

## 📖 Interactive Docs

**Swagger UI:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

Auto-generated from FastAPI, includes:
- All endpoints
- Request/response schemas
- Try-it-out functionality
- Authentication setup

---

## 🆘 Common Issues

### "Not authenticated"
- Check token is included: `Authorization: Bearer TOKEN`
- Token may be expired (get new one from /auth/login)
- Token format must be exactly: `Bearer ` + token

### "Rate limit exceeded"
- Wait 60 seconds before retrying
- Reduce request frequency
- Check rate limit for specific endpoint

### "Post not found"
- Verify post_id is correct
- Post may have been deleted
- Check you're using correct environment

### "Already liked"
- User has already liked this post
- Unlike first, then like again

### XSS content showing HTML entities
- This is correct behavior
- Frontend should render as-is (will show as text, not execute)

---

**Last Updated:** February 15, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready ✅
