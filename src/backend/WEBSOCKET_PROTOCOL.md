# WebSocket Protocol Documentation

Complete reference for all WebSocket messages in MyVerSona Backend.

---

## Connection

### Endpoint Format
```
ws://localhost:8000/ws/chat/{user_id}?token={JWT_TOKEN}
ws://localhost:8000/ws/notifications/{user_id}?token={JWT_TOKEN}
ws://localhost:8000/ws/presence/{user_id}?token={JWT_TOKEN}
```

### Authentication
- JWT token passed as query parameter
- Token validated on connection
- Connection rejected if invalid (code 1008)

### Connection Lifecycle
1. Client connects with JWT
2. Server validates token
3. Server accepts connection
4. Server sends `connection_established`
5. Server sends queued messages (if any)
6. Client can send/receive messages
7. On disconnect: client reconnects with same token

---

## Chat WebSocket (`/ws/chat/{user_id}`)

### Server → Client Messages

#### 1. Connection Established
Sent immediately after successful connection.

```json
{
  "type": "connection_established",
  "user_id": "user_123",
  "timestamp": "2026-02-15T10:30:00.123Z"
}
```

#### 2. New Message
Sent when user receives a message from another user.

```json
{
  "type": "new_message",
  "message": {
    "message_id": "msg_abc123",
    "conversation_id": "conv_xyz789",
    "sender_id": "user_456",
    "receiver_id": "user_123",
    "content": "Hey, how are you?",
    "chat_type": "casual",
    "media_url": null,
    "media_type": null,
    "is_read": false,
    "is_deleted": false,
    "created_at": "2026-02-15T10:30:00.123Z",
    "updated_at": "2026-02-15T10:30:00.123Z"
  },
  "conversation_id": "conv_xyz789"
}
```

#### 3. Message Sent Confirmation
Sent to sender after their message is successfully saved.

```json
{
  "type": "message_sent",
  "message": {
    "message_id": "msg_def456",
    "conversation_id": "conv_xyz789",
    "sender_id": "user_123",
    "receiver_id": "user_456",
    "content": "I'm doing great, thanks!",
    "chat_type": "casual",
    "media_url": null,
    "media_type": null,
    "is_read": false,
    "is_deleted": false,
    "created_at": "2026-02-15T10:30:05.456Z",
    "updated_at": "2026-02-15T10:30:05.456Z"
  },
  "conversation_id": "conv_xyz789"
}
```

#### 4. Typing Indicator
Sent when other user is typing.

```json
{
  "type": "typing",
  "sender_id": "user_456",
  "conversation_id": "conv_xyz789",
  "is_typing": true
}
```

Stop typing:
```json
{
  "type": "typing",
  "sender_id": "user_456",
  "conversation_id": "conv_xyz789",
  "is_typing": false
}
```

#### 5. Messages Read
Sent when other user marks messages as read.

```json
{
  "type": "messages_read",
  "conversation_id": "conv_xyz789",
  "read_by": "user_456"
}
```

#### 6. Joined Conversation
Confirmation after joining a conversation.

```json
{
  "type": "joined_conversation",
  "conversation_id": "conv_xyz789"
}
```

#### 7. AI Response
Response from AI career assistant.

```json
{
  "type": "ai_response",
  "query": "What skills should I learn for data science?",
  "response": "For data science, I recommend focusing on...",
  "timestamp": "2026-02-15T10:35:00.000Z"
}
```

#### 8. Error
Sent when an error occurs.

```json
{
  "type": "error",
  "message": "Failed to send message"
}
```

#### 9. Queued Messages
Sent on connection if user has offline messages.

```json
{
  "type": "queued_messages",
  "count": 3,
  "messages": [
    {
      "type": "new_message",
      "message": {...},
      "conversation_id": "conv_xyz789",
      "queued_at": "2026-02-15T10:00:00.000Z"
    },
    {...}
  ]
}
```

---

### Client → Server Messages

#### 1. Send Message
Send a chat message to another user.

```json
{
  "type": "send_message",
  "receiver_id": "user_456",
  "content": "Hello! How are you?",
  "chat_type": "casual",
  "conversation_id": "conv_xyz789",
  "media_url": null,
  "media_type": null
}
```

**Fields**:
- `receiver_id` (required): User ID of receiver
- `content` (required): Message content (1-1000 chars)
- `chat_type` (required): "casual" or "professional"
- `conversation_id` (optional): If null, conversation is created
- `media_url` (optional): URL of media attachment
- `media_type` (optional): "image", "video", or "file"

**Validation**:
- Content: 1-1000 characters
- XSS: HTML escaped automatically
- Rate limit: 30 messages per minute
- Duplicate detection: Blocked if same message within 5s

#### 2. Typing Indicator
Notify other user that you're typing.

```json
{
  "type": "typing",
  "receiver_id": "user_456",
  "conversation_id": "conv_xyz789",
  "is_typing": true
}
```

Stop typing:
```json
{
  "type": "typing",
  "receiver_id": "user_456",
  "conversation_id": "conv_xyz789",
  "is_typing": false
}
```

**Best Practice**: Send `is_typing: false` after 3 seconds of inactivity.

#### 3. Read Receipt
Mark all messages in conversation as read.

```json
{
  "type": "read_receipt",
  "conversation_id": "conv_xyz789"
}
```

**Effect**:
- All unread messages marked as read
- Unread counter reset to 0
- Other participants notified via `messages_read`

#### 4. Join Conversation
Join a conversation room to receive real-time updates.

```json
{
  "type": "join_conversation",
  "conversation_id": "conv_xyz789"
}
```

**Best Practice**: Join conversation when user opens chat screen.

#### 5. Leave Conversation
Leave a conversation room.

```json
{
  "type": "leave_conversation",
  "conversation_id": "conv_xyz789"
}
```

**Best Practice**: Leave conversation when user closes chat screen.

#### 6. AI Query
Ask AI career assistant a question.

```json
{
  "type": "ai_query",
  "query": "What skills should I learn for data science?"
}
```

**Response**: Sent as `ai_response` message.

---

## Notification WebSocket (`/ws/notifications/{user_id}`)

### Server → Client Messages

#### 1. Connection Established
```json
{
  "type": "connection_established",
  "user_id": "user_123",
  "timestamp": "2026-02-15T10:30:00.123Z",
  "connection_type": "notifications"
}
```

#### 2. Pending Notifications
Sent on connection if user has unread notifications.

```json
{
  "type": "pending_notifications",
  "notifications": [
    {
      "notification_id": "notif_123",
      "user_id": "user_123",
      "type": "like",
      "actor_id": "user_456",
      "actor_username": "john_doe",
      "actor_avatar": "https://...",
      "post_id": "post_789",
      "is_read": false,
      "created_at": "2026-02-15T10:00:00.000Z"
    },
    {...}
  ],
  "count": 5
}
```

#### 3. New Notification
Sent when user receives a new notification.

```json
{
  "type": "new_notification",
  "notification": {
    "notification_id": "notif_456",
    "user_id": "user_123",
    "type": "comment",
    "actor_id": "user_789",
    "actor_username": "jane_smith",
    "actor_avatar": "https://...",
    "post_id": "post_123",
    "message_preview": "Great post!",
    "is_read": false,
    "created_at": "2026-02-15T10:30:00.000Z"
  }
}
```

**Notification Types**:
- `"like"` - Someone liked your post
- `"comment"` - Someone commented on your post
- `"message"` - Someone sent you a message
- `"follow"` - Someone followed you
- `"mention"` - Someone mentioned you

#### 4. Notification Read
Confirmation that notification was marked as read.

```json
{
  "type": "notification_read",
  "notification_id": "notif_123"
}
```

#### 5. All Notifications Read
Confirmation that all notifications were marked as read.

```json
{
  "type": "all_notifications_read"
}
```

#### 6. Notification Cleared
Confirmation that notification was deleted.

```json
{
  "type": "notification_cleared",
  "notification_id": "notif_123"
}
```

#### 7. Pong
Response to ping (keep-alive).

```json
{
  "type": "pong",
  "timestamp": "2026-02-15T10:30:00.000Z"
}
```

---

### Client → Server Messages

#### 1. Mark Read
Mark a specific notification as read.

```json
{
  "type": "mark_read",
  "notification_id": "notif_123"
}
```

#### 2. Mark All Read
Mark all notifications as read.

```json
{
  "type": "mark_all_read"
}
```

#### 3. Clear Notification
Delete a notification.

```json
{
  "type": "clear_notification",
  "notification_id": "notif_123"
}
```

#### 4. Ping
Keep-alive message.

```json
{
  "type": "ping"
}
```

**Best Practice**: Send ping every 30 seconds to keep connection alive.

---

## Presence WebSocket (`/ws/presence/{user_id}`)

### Server → Client Messages

#### 1. Connection Established
```json
{
  "type": "connection_established",
  "user_id": "user_123",
  "timestamp": "2026-02-15T10:30:00.123Z",
  "connection_type": "presence"
}
```

#### 2. User Online
Sent when a user comes online.

```json
{
  "type": "user_online",
  "user_id": "user_456",
  "timestamp": "2026-02-15T10:30:00.000Z"
}
```

#### 3. User Offline
Sent when a user goes offline.

```json
{
  "type": "user_offline",
  "user_id": "user_456",
  "timestamp": "2026-02-15T10:35:00.000Z",
  "last_seen": "2026-02-15T10:35:00.000Z"
}
```

#### 4. Presence Update
Batch update of user presence status.

```json
{
  "type": "presence_update",
  "users": [
    {"user_id": "user_456", "status": "online"},
    {"user_id": "user_789", "status": "offline", "last_seen": "2026-02-15T10:00:00.000Z"}
  ]
}
```

---

### Client → Server Messages

#### 1. Subscribe
Subscribe to presence updates for specific users.

```json
{
  "type": "subscribe",
  "user_ids": ["user_456", "user_789", "user_101"]
}
```

#### 2. Unsubscribe
Unsubscribe from presence updates.

```json
{
  "type": "unsubscribe",
  "user_ids": ["user_456"]
}
```

---

## Error Handling

### Connection Errors

#### Authentication Failed (Code 1008)
```
Close code: 1008
Reason: "Authentication failed"
```

**Cause**: Invalid or expired JWT token.

**Action**: Refresh token and reconnect.

#### Rate Limit Exceeded (Code 1008)
```
Close code: 1008
Reason: "Rate limit exceeded"
```

**Cause**: Too many messages sent.

**Action**: Wait 60 seconds and reconnect.

### Message Errors

#### Invalid Message Format
```json
{
  "type": "error",
  "code": "BAD_REQUEST",
  "message": "Invalid message format"
}
```

#### Missing Required Field
```json
{
  "type": "error",
  "code": "BAD_REQUEST",
  "message": "Missing receiver_id"
}
```

#### Content Too Long
```json
{
  "type": "error",
  "code": "BAD_REQUEST",
  "message": "Content exceeds 1000 characters"
}
```

#### Spam Detected
```json
{
  "type": "error",
  "code": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Please slow down."
}
```

#### Duplicate Message
```json
{
  "type": "error",
  "code": "DUPLICATE",
  "message": "Duplicate message detected"
}
```

---

## Best Practices

### Connection Management

1. **Store Connection**:
```typescript
const ws = useRef<WebSocket | null>(null);
```

2. **Auto-Reconnect**:
```typescript
ws.current.onclose = () => {
  setTimeout(() => reconnect(), 3000);
};
```

3. **Handle Reconnection**:
```typescript
ws.current.onopen = () => {
  // Rejoin conversations
  joinAllConversations();
};
```

### Message Handling

1. **Parse Messages Safely**:
```typescript
ws.current.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    handleMessage(data);
  } catch (e) {
    console.error('Invalid message:', e);
  }
};
```

2. **Type Check**:
```typescript
const handleMessage = (data: any) => {
  switch (data.type) {
    case 'new_message':
      handleNewMessage(data);
      break;
    case 'typing':
      handleTyping(data);
      break;
    // ...
  }
};
```

3. **Queue Messages**:
```typescript
const messageQueue: any[] = [];

const sendMessage = (msg: any) => {
  if (ws.current?.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify(msg));
  } else {
    messageQueue.push(msg);
  }
};
```

### Typing Indicators

1. **Debounce Typing**:
```typescript
const typingTimeout = useRef<NodeJS.Timeout>();

const handleTyping = () => {
  sendTypingIndicator(true);
  
  clearTimeout(typingTimeout.current);
  typingTimeout.current = setTimeout(() => {
    sendTypingIndicator(false);
  }, 3000);
};
```

2. **Clear on Send**:
```typescript
const sendMessage = (content: string) => {
  sendTypingIndicator(false);
  // Send message...
};
```

### Keep-Alive

```typescript
setInterval(() => {
  if (ws.current?.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // Every 30 seconds
```

---

## Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| Send message | 30 | 1 minute |
| Typing indicator | 10 | 1 minute |
| AI query | 5 | 1 minute |
| Mark read | 100 | 1 minute |
| Subscribe presence | 50 | 1 minute |

**Exceeded Rate Limit**:
- WebSocket closed with code 1008
- Wait 60 seconds before reconnecting
- Implement exponential backoff

---

## Security

### Token Expiry
- JWT tokens expire after 7 days
- Refresh token before expiry
- Disconnect and reconnect with new token

### Message Sanitization
- All content HTML-escaped server-side
- No XSS possible in messages
- Safe to render directly

### Validation
- Message length: 1-1000 characters
- User IDs validated
- Conversation participants verified

---

## Examples

See `/backend/INTEGRATION_EXAMPLES.md` for complete code examples.

---

**Protocol Version**: 1.0
**Last Updated**: Week 2 Implementation
**Status**: Production-Ready ✅
