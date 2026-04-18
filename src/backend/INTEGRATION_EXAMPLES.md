# Week 2 Integration Examples

## How to Integrate Notifications with Posts

### Example 1: Send Notification When User Likes a Post

```python
# In routes/posts.py - like_post endpoint

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    authorization: Optional[str] = Header(None)
):
    try:
        user_id = await get_current_user_id(authorization)
        
        # Like the post
        success = await FirebaseService.like_post(post_id, user_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="Post already liked or not found")
        
        # ========== SEND NOTIFICATION TO POST OWNER ==========
        
        # Get post to find owner
        post = await FirebaseService.get_post(post_id)
        post_owner_id = post.get("user_id")
        
        # Don't notify self
        if post_owner_id != user_id:
            # Get liker info
            liker = await FirebaseService.get_user(user_id)
            
            # Check for duplicate notification
            duplicate = await FirebaseService.check_notification_exists(
                user_id=post_owner_id,
                notification_type="like",
                actor_id=user_id,
                post_id=post_id
            )
            
            if not duplicate:
                # Send notification
                await notification_handler.send_notification(
                    user_id=post_owner_id,
                    notification={
                        "type": "like",
                        "actor_id": user_id,
                        "actor_username": liker.get("username"),
                        "actor_avatar": liker.get("avatar_url"),
                        "post_id": post_id,
                        "message_preview": None
                    }
                )
        
        # ====================================================
        
        return {"success": True, "message": "Post liked successfully"}
    
    except Exception as e:
        logger.error(f"Like post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to like post")
```

### Example 2: Send Notification When User Comments

```python
# In routes/posts.py - create_comment endpoint

@router.post("/{post_id}/comments", response_model=Comment)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    authorization: Optional[str] = Header(None)
):
    try:
        user_id = await get_current_user_id(authorization)
        
        # Get user profile
        user = await FirebaseService.get_user(user_id)
        
        # Create comment
        comment_doc = {
            "user_id": user_id,
            "username": user["username"],
            "user_avatar": user.get("avatar_url"),
            "full_name": user["full_name"],
            "content": comment_data.content,
        }
        
        comment = await FirebaseService.create_comment(post_id, comment_doc)
        
        if not comment:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # ========== SEND NOTIFICATION TO POST OWNER ==========
        
        # Get post to find owner
        post = await FirebaseService.get_post(post_id)
        post_owner_id = post.get("user_id")
        
        # Don't notify self
        if post_owner_id != user_id:
            # Check for duplicate
            duplicate = await FirebaseService.check_notification_exists(
                user_id=post_owner_id,
                notification_type="comment",
                actor_id=user_id,
                post_id=post_id
            )
            
            if not duplicate:
                # Send notification
                await notification_handler.send_notification(
                    user_id=post_owner_id,
                    notification={
                        "type": "comment",
                        "actor_id": user_id,
                        "actor_username": user.get("username"),
                        "actor_avatar": user.get("avatar_url"),
                        "post_id": post_id,
                        "message_preview": comment_data.content[:100]
                    }
                )
        
        # ====================================================
        
        logger.info(f"Comment created: {comment['comment_id']} on post {post_id}")
        return comment
    
    except Exception as e:
        logger.error(f"Create comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")
```

---

## WebSocket Message Format Examples

### Client → Server Messages

#### Send Chat Message
```json
{
  "type": "send_message",
  "receiver_id": "user_456",
  "content": "Hello! How are you?",
  "chat_type": "casual",
  "conversation_id": "conv_123"
}
```

#### Typing Indicator
```json
{
  "type": "typing",
  "receiver_id": "user_456",
  "conversation_id": "conv_123",
  "is_typing": true
}
```

#### Mark Messages as Read
```json
{
  "type": "read_receipt",
  "conversation_id": "conv_123"
}
```

#### AI Query
```json
{
  "type": "ai_query",
  "query": "What skills should I learn for data science?"
}
```

### Server → Client Messages

#### New Message Received
```json
{
  "type": "new_message",
  "message": {
    "message_id": "msg_789",
    "conversation_id": "conv_123",
    "sender_id": "user_456",
    "content": "I'm doing great, thanks!",
    "created_at": "2026-02-15T10:30:00Z",
    "is_read": false
  },
  "conversation_id": "conv_123"
}
```

#### Message Sent Confirmation
```json
{
  "type": "message_sent",
  "message": {
    "message_id": "msg_790",
    "conversation_id": "conv_123",
    "sender_id": "user_123",
    "content": "Hello! How are you?",
    "created_at": "2026-02-15T10:29:55Z",
    "is_read": false
  },
  "conversation_id": "conv_123"
}
```

#### Typing Indicator
```json
{
  "type": "typing",
  "sender_id": "user_456",
  "conversation_id": "conv_123",
  "is_typing": true
}
```

#### Messages Read
```json
{
  "type": "messages_read",
  "conversation_id": "conv_123",
  "read_by": "user_456"
}
```

#### New Notification
```json
{
  "type": "new_notification",
  "notification": {
    "notification_id": "notif_999",
    "user_id": "user_123",
    "type": "like",
    "actor_id": "user_456",
    "actor_username": "john_doe",
    "actor_avatar": "https://...",
    "post_id": "post_789",
    "is_read": false,
    "created_at": "2026-02-15T10:35:00Z"
  }
}
```

---

## Frontend Integration Example (React)

### WebSocket Chat Connection
```typescript
import { useEffect, useRef, useState } from 'react';

function useChatWebSocket(userId: string, token: string) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(
      `ws://localhost:8000/ws/chat/${userId}?token=${token}`
    );

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'typing') {
        // Handle typing indicator
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
    };
  }, [userId, token]);

  const sendMessage = (receiverId: string, content: string, chatType: string) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({
        type: 'send_message',
        receiver_id: receiverId,
        content: content,
        chat_type: chatType
      }));
    }
  };

  const sendTypingIndicator = (receiverId: string, isTyping: boolean) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({
        type: 'typing',
        receiver_id: receiverId,
        is_typing: isTyping
      }));
    }
  };

  return {
    connected,
    messages,
    sendMessage,
    sendTypingIndicator
  };
}
```

### Notifications Hook
```typescript
function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const response = await fetch('http://localhost:8000/api/v1/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await fetch(`http://localhost:8000/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Update local state
    setNotifications(prev =>
      prev.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await fetch('http://localhost:8000/api/v1/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
```

### Search Example
```typescript
const searchUsers = async (query: string, token: string) => {
  const response = await fetch(
    `http://localhost:8000/api/v1/search/users?q=${encodeURIComponent(query)}&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.users;
};

const searchPosts = async (query: string, token: string) => {
  const response = await fetch(
    `http://localhost:8000/api/v1/search/posts?q=${encodeURIComponent(query)}&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.posts;
};
```

### Content Moderation Before Posting
```typescript
const createPost = async (content: string, token: string) => {
  // Step 1: Moderate content
  const moderationResponse = await fetch(
    'http://localhost:8000/api/v1/moderation/check',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    }
  );
  
  const moderation = await moderationResponse.json();
  
  // Step 2: Check if content is appropriate
  if (!moderation.is_appropriate) {
    throw new Error(`Content blocked: ${moderation.reason}`);
  }
  
  // Step 3: Create post
  const postResponse = await fetch(
    'http://localhost:8000/api/v1/posts',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        feed_type: 'entertainment',
        media_urls: [],
        hashtags: []
      })
    }
  );
  
  return await postResponse.json();
};
```

---

## Testing with cURL

### Test Notifications
```bash
# Get notifications
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/notifications?limit=20&unread_only=true

# Mark notification as read
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/notifications/notif_123/read

# Mark all as read
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/notifications/read-all

# Delete notification
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/notifications/notif_123
```

### Test Search
```bash
# Search users
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/search/users?q=john&limit=20"

# Search posts
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/search/posts?q=programming&limit=20"

# Combined search
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/search?q=tech&users_limit=10&posts_limit=10"
```

### Test Moderation
```bash
# Check content moderation
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a test post about programming"}' \
  http://localhost:8000/api/v1/moderation/check
```

---

## Database Migration Script

If you need to add `username_lower` and `full_name_lower` fields to existing users:

```python
# scripts/migrate_search_fields.py

from firebase_admin import firestore
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase
cred = credentials.Certificate('path/to/serviceAccount.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def migrate_user_search_fields():
    """Add lowercase fields for search"""
    users_ref = db.collection('users')
    users = users_ref.stream()
    
    batch = db.batch()
    count = 0
    
    for user in users:
        user_data = user.to_dict()
        user_ref = users_ref.document(user.id)
        
        updates = {}
        
        if 'username' in user_data:
            updates['username_lower'] = user_data['username'].lower()
        
        if 'full_name' in user_data:
            updates['full_name_lower'] = user_data['full_name'].lower()
        
        if updates:
            batch.update(user_ref, updates)
            count += 1
        
        # Commit every 500 updates
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"Migrated {count} users...")
    
    # Commit remaining
    if count % 500 != 0:
        batch.commit()
    
    print(f"Migration complete! Updated {count} users.")

if __name__ == "__main__":
    migrate_user_search_fields()
```

---

All integration examples are production-ready and follow best practices! 🚀
