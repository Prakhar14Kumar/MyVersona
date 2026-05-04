from firebase_admin import firestore
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import logging

logger = logging.getLogger(__name__)
db = firestore.client()

class FirebaseService:
    """Production-grade Firebase operations with transactions and error handling"""
    
    # ==================== USER OPERATIONS ====================
    
    @staticmethod
    async def create_user(uid: str, user_data: dict) -> dict:
        """Create user in Firestore"""
        try:
            user_ref = db.collection("users").document(uid)
            
            user_doc = {
                **user_data,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "followers_count": 0,
                "following_count": 0,
                "posts_count": 0,
                "is_verified": False,
                "is_mentor": False,
                "is_recruiter": False,
            }
            
            user_ref.set(user_doc)
            logger.info(f"User created: {uid}")
            return {**user_doc, "uid": uid}
        except Exception as e:
            logger.error(f"Create user error: {e}")
            raise
    
    @staticmethod
    async def get_user(uid: str) -> Optional[dict]:
        """Get user by UID"""
        try:
            user_ref = db.collection("users").document(uid)
            user = user_ref.get()
            
            if user.exists:
                return {**user.to_dict(), "uid": user.id}
            return None
        except Exception as e:
            logger.error(f"Get user error: {e}")
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        try:
            users = db.collection("users").where("email", "==", email).limit(1).stream()
            
            for user in users:
                return {**user.to_dict(), "uid": user.id}
            return None
        except Exception as e:
            logger.error(f"Get user by email error: {e}")
            return None
    
    @staticmethod
    async def get_user_by_username(username: str) -> Optional[dict]:
        """Get user by username"""
        try:
            users = db.collection("users").where("username", "==", username).limit(1).stream()
            
            for user in users:
                return {**user.to_dict(), "uid": user.id}
            return None
        except Exception as e:
            logger.error(f"Get user by username error: {e}")
            return None
    
    @staticmethod
    async def update_user(uid: str, updates: dict) -> dict:
        """Update user data"""
        try:
            user_ref = db.collection("users").document(uid)
            
            updates["updated_at"] = datetime.utcnow()
            user_ref.update(updates)
            
            user = user_ref.get()
            logger.info(f"User updated: {uid}")
            return {**user.to_dict(), "uid": uid}
        except Exception as e:
            logger.error(f"Update user error: {e}")
            raise
    
    # ==================== POST OPERATIONS ====================
    
    @staticmethod
    async def create_post(post_data: dict) -> dict:
        """Create post with transaction for user posts_count"""
        try:
            post_id = str(uuid.uuid4())
            post_ref = db.collection("posts").document(post_id)
            user_ref = db.collection("users").document(post_data["user_id"])
            
            post_doc = {
                **post_data,
                "post_id": post_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "likes_count": 0,
                "comments_count": 0,
                "shares_count": 0,
                "bookmarks_count": 0,
            }
            
            # Use transaction to ensure atomicity
            @firestore.transactional
            def create_post_transaction(transaction):
                # Create post
                transaction.set(post_ref, post_doc)
                # Increment user posts count
                transaction.update(user_ref, {"posts_count": firestore.Increment(1)})
            
            transaction = db.transaction()
            create_post_transaction(transaction)
            
            logger.info(f"Post created: {post_id} by user {post_data['user_id']}")
            return post_doc
        except Exception as e:
            logger.error(f"Create post error: {e}")
            raise
    
    @staticmethod
    async def get_post(post_id: str) -> Optional[dict]:
        """Get post by ID"""
        try:
            post_ref = db.collection("posts").document(post_id)
            post = post_ref.get()
            
            if post.exists:
                return post.to_dict()
            return None
        except Exception as e:
            logger.error(f"Get post error: {e}")
            return None
    
    @staticmethod
    async def get_feed_posts(feed_type: str, limit: int = 20, last_doc_id: Optional[str] = None) -> List[dict]:
        """Get posts for feed with cursor pagination"""
        try:
            query = db.collection("posts")\
                .where("feed_type", "==", feed_type)\
                .order_by("created_at", direction=firestore.Query.DESCENDING)\
                .limit(limit)
            
            if last_doc_id:
                last_doc = db.collection("posts").document(last_doc_id).get()
                if last_doc.exists:
                    query = query.start_after(last_doc)
            
            posts = []
            for post in query.stream():
                posts.append(post.to_dict())
            
            return posts
        except Exception as e:
            logger.error(f"Get feed posts error: {e}")
            return []
    
    @staticmethod
    async def like_post(post_id: str, user_id: str) -> bool:
        """Like a post with transaction to prevent race conditions"""
        try:
            post_ref = db.collection("posts").document(post_id)
            like_ref = post_ref.collection("likes").document(user_id)
            
            # Check if post exists
            post = post_ref.get()
            if not post.exists:
                logger.warning(f"Post not found: {post_id}")
                return False
            
            # Use transaction to ensure atomicity
            @firestore.transactional
            def like_transaction(transaction):
                # Check if already liked
                like_doc = like_ref.get(transaction=transaction)
                if like_doc.exists:
                    return False
                
                # Create like document
                transaction.set(like_ref, {
                    "user_id": user_id,
                    "created_at": datetime.utcnow()
                })
                
                # Increment likes_count atomically
                transaction.update(post_ref, {
                    "likes_count": firestore.Increment(1)
                })
                
                return True
            
            transaction = db.transaction()
            result = like_transaction(transaction)
            
            if result:
                logger.info(f"Post liked: {post_id} by user {user_id}")
            else:
                logger.warning(f"Post already liked: {post_id} by user {user_id}")
            
            return result
        except Exception as e:
            logger.error(f"Like post error: {e}")
            raise
    
    @staticmethod
    async def unlike_post(post_id: str, user_id: str) -> bool:
        """Unlike a post with transaction to prevent race conditions"""
        try:
            post_ref = db.collection("posts").document(post_id)
            like_ref = post_ref.collection("likes").document(user_id)
            
            # Check if post exists
            post = post_ref.get()
            if not post.exists:
                logger.warning(f"Post not found: {post_id}")
                return False
            
            # Use transaction to ensure atomicity
            @firestore.transactional
            def unlike_transaction(transaction):
                # Check if liked
                like_doc = like_ref.get(transaction=transaction)
                if not like_doc.exists:
                    return False
                
                # Delete like document
                transaction.delete(like_ref)
                
                # Decrement likes_count atomically
                transaction.update(post_ref, {
                    "likes_count": firestore.Increment(-1)
                })
                
                return True
            
            transaction = db.transaction()
            result = unlike_transaction(transaction)
            
            if result:
                logger.info(f"Post unliked: {post_id} by user {user_id}")
            else:
                logger.warning(f"Post not liked: {post_id} by user {user_id}")
            
            return result
        except Exception as e:
            logger.error(f"Unlike post error: {e}")
            raise
    
    @staticmethod
    async def check_if_liked(post_id: str, user_id: str) -> bool:
        """Check if user has liked a post"""
        try:
            like_ref = db.collection("posts").document(post_id).collection("likes").document(user_id)
            like = like_ref.get()
            return like.exists
        except Exception as e:
            logger.error(f"Check if liked error: {e}")
            return False
    
    # ==================== COMMENT OPERATIONS ====================
    
    @staticmethod
    async def create_comment(post_id: str, comment_data: dict) -> Optional[dict]:
        """Create comment with transaction to increment comments_count"""
        try:
            # Verify post exists first
            post_ref = db.collection("posts").document(post_id)
            post = post_ref.get()
            if not post.exists:
                logger.warning(f"Post not found: {post_id}")
                return None
            
            comment_id = str(uuid.uuid4())
            comment_ref = post_ref.collection("comments").document(comment_id)
            
            comment_doc = {
                **comment_data,
                "comment_id": comment_id,
                "post_id": post_id,
                "created_at": datetime.utcnow(),
                "likes_count": 0,
            }
            
            # Use transaction to ensure atomicity
            @firestore.transactional
            def create_comment_transaction(transaction):
                # Create comment
                transaction.set(comment_ref, comment_doc)
                # Increment comments_count
                transaction.update(post_ref, {
                    "comments_count": firestore.Increment(1)
                })
            
            transaction = db.transaction()
            create_comment_transaction(transaction)
            
            logger.info(f"Comment created: {comment_id} on post {post_id}")
            return comment_doc
        except Exception as e:
            logger.error(f"Create comment error: {e}")
            raise
    
    @staticmethod
    async def get_comments(post_id: str, limit: int = 20, cursor: Optional[str] = None) -> tuple[List[dict], Optional[str]]:
        """
        Get comments for a post with cursor pagination
        Returns: (comments_list, next_cursor)
        """
        try:
            # Verify post exists
            post_ref = db.collection("posts").document(post_id)
            post = post_ref.get()
            if not post.exists:
                logger.warning(f"Post not found: {post_id}")
                return [], None
            
            # Build query with cursor pagination
            query = post_ref.collection("comments")\
                .order_by("created_at", direction=firestore.Query.ASCENDING)\
                .limit(limit + 1)  # Fetch one extra to check if there are more
            
            if cursor:
                # Get cursor document
                cursor_doc = post_ref.collection("comments").document(cursor).get()
                if cursor_doc.exists:
                    query = query.start_after(cursor_doc)
            
            # Fetch comments
            comments_docs = list(query.stream())
            
            # Check if there are more comments
            has_more = len(comments_docs) > limit
            if has_more:
                comments_docs = comments_docs[:limit]
            
            # Convert to dict list
            comments = [doc.to_dict() for doc in comments_docs]
            
            # Get next cursor (last comment's ID)
            next_cursor = comments[-1]["comment_id"] if comments and has_more else None
            
            return comments, next_cursor
        except Exception as e:
            logger.error(f"Get comments error: {e}")
            return [], None
    
    @staticmethod
    async def delete_post(post_id: str, user_id: str) -> bool:
        """Delete post with transaction"""
        try:
            post_ref = db.collection("posts").document(post_id)
            post = post_ref.get()
            
            if not post.exists:
                return False
            
            post_data = post.to_dict()
            if post_data.get("user_id") != user_id:
                return False
            
            user_ref = db.collection("users").document(user_id)
            
            # Use transaction
            @firestore.transactional
            def delete_post_transaction(transaction):
                transaction.delete(post_ref)
                transaction.update(user_ref, {"posts_count": firestore.Increment(-1)})
            
            transaction = db.transaction()
            delete_post_transaction(transaction)
            
            logger.info(f"Post deleted: {post_id}")
            return True
        except Exception as e:
            logger.error(f"Delete post error: {e}")
            return False
    
    @staticmethod
    async def update_post(post_id: str, updates: dict) -> Optional[dict]:
        """Update post"""
        try:
            post_ref = db.collection("posts").document(post_id)
            
            updates["updated_at"] = datetime.utcnow()
            post_ref.update(updates)
            
            post = post_ref.get()
            logger.info(f"Post updated: {post_id}")
            return post.to_dict() if post.exists else None
        except Exception as e:
            logger.error(f"Update post error: {e}")
            raise
    
    # ==================== CHAT OPERATIONS ====================
    
    @staticmethod
    async def create_conversation(participants: List[str], chat_type: str) -> dict:
        """Create or get existing conversation"""
        try:
            # Check if conversation already exists
            conversations_ref = db.collection("chats")
            
            # Query for existing conversation with same participants
            query = conversations_ref.where("participants", "array_contains", participants[0]).stream()
            
            for conv in query:
                conv_data = conv.to_dict()
                if set(conv_data.get("participants", [])) == set(participants):
                    logger.info(f"Found existing conversation: {conv.id}")
                    return {**conv_data, "conversation_id": conv.id}
            
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            conversation_ref = conversations_ref.document(conversation_id)
            
            conversation_doc = {
                "conversation_id": conversation_id,
                "participants": participants,
                "chatType": chat_type,
                "lastMessage": "",
                "lastSenderId": None,
                "unreadCount": {p: 0 for p in participants},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            
            conversation_ref.set(conversation_doc)
            logger.info(f"Conversation created: {conversation_id}")
            return conversation_doc
        except Exception as e:
            logger.error(f"Create conversation error: {e}")
            raise
    
    @staticmethod
    async def get_conversation(conversation_id: str) -> Optional[dict]:
        """Get conversation by ID"""
        try:
            conversation_ref = db.collection("chats").document(conversation_id)
            conversation = conversation_ref.get()
            
            if conversation.exists:
                return {**conversation.to_dict(), "conversation_id": conversation.id}
            return None
        except Exception as e:
            logger.error(f"Get conversation error: {e}")
            return None
    
    @staticmethod
    async def get_user_conversations(user_id: str, limit: int = 20) -> List[dict]:
        """Get all conversations for a user"""
        try:
            conversations_ref = db.collection("chats")
            query = conversations_ref\
                .where("participants", "array_contains", user_id)\
                .order_by("updatedAt", direction=firestore.Query.DESCENDING)\
                .limit(limit)
            
            conversations = []
            for conv in query.stream():
                conv_data = conv.to_dict()
                conv_data["conversation_id"] = conv.id
                conversations.append(conv_data)
            
            return conversations
        except Exception as e:
            logger.error(f"Get user conversations error: {e}")
            return []
    
    @staticmethod
    async def send_message(conversation_id: str, message_data: dict) -> dict:
        """Send message in conversation with transaction"""
        try:
            conversation_ref = db.collection("chats").document(conversation_id)
            message_id = str(uuid.uuid4())
            message_ref = conversation_ref.collection("messages").document(message_id)
            
            # Sanitize content (basic XSS protection)
            content = message_data.get("content", "")
            content = content.replace("<", "&lt;").replace(">", "&gt;")
            
            message_doc = {
                "message_id": message_id,
                "conversation_id": conversation_id,
                "sender_id": message_data["sender_id"],
                "receiver_id": message_data["receiver_id"],
                "content": content,
                "chatType": message_data.get("chat_type", "casual"),
                "media_url": message_data.get("media_url"),
                "media_type": message_data.get("media_type"),
                "is_read": False,
                "is_deleted": False,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            
            # Use transaction to update conversation and create message
            @firestore.transactional
            def send_message_transaction(transaction):
                # Create message
                transaction.set(message_ref, message_doc)
                
                # Update conversation
                receiver_id = message_data["receiver_id"]
                transaction.update(conversation_ref, {
                    "lastMessage": content[:100],  # Preview
                    "lastSenderId": message_data["sender_id"],
                    f"unreadCount.{receiver_id}": firestore.Increment(1),
                    "updatedAt": datetime.utcnow(),
                })
            
            transaction = db.transaction()
            send_message_transaction(transaction)
            
            logger.info(f"Message sent: {message_id} in conversation {conversation_id}")
            return message_doc
        except Exception as e:
            logger.error(f"Send message error: {e}")
            raise
    
    @staticmethod
    async def get_messages(conversation_id: str, limit: int = 50, cursor: Optional[str] = None) -> tuple[List[dict], Optional[str]]:
        """Get messages with cursor pagination"""
        try:
            conversation_ref = db.collection("chats").document(conversation_id)
            query = conversation_ref.collection("messages")\
                .order_by("createdAt", direction=firestore.Query.ASCENDING)\
                .limit(limit + 1)
            
            if cursor:
                cursor_doc = conversation_ref.collection("messages").document(cursor).get()
                if cursor_doc.exists:
                    query = query.start_after(cursor_doc)
            
            messages_docs = list(query.stream())
            has_more = len(messages_docs) > limit
            
            if has_more:
                messages_docs = messages_docs[:limit]
            
            messages = [doc.to_dict() for doc in messages_docs]
            next_cursor = messages[-1]["message_id"] if messages and has_more else None
            
            return messages, next_cursor
        except Exception as e:
            logger.error(f"Get messages error: {e}")
            return [], None
    
    @staticmethod
    async def mark_messages_as_read(conversation_id: str, user_id: str) -> bool:
        """Mark all messages as read for a user"""
        try:
            conversation_ref = db.collection("chats").document(conversation_id)
            messages_ref = conversation_ref.collection("messages")
            
            # Get unread messages for this user
            query = messages_ref.where("receiver_id", "==", user_id).where("is_read", "==", False).stream()
            
            # Batch update
            batch = db.batch()
            count = 0
            
            for message in query:
                batch.update(message.reference, {"is_read": True})
                count += 1
            
            # Reset unread count
            batch.update(conversation_ref, {f"unreadCount.{user_id}": 0})
            
            batch.commit()
            logger.info(f"Marked {count} messages as read for user {user_id} in conversation {conversation_id}")
            return True
        except Exception as e:
            logger.error(f"Mark messages as read error: {e}")
            return False
    
    # ==================== NOTIFICATION OPERATIONS ====================
    
    @staticmethod
    async def create_notification(user_id: str, notification_data: dict) -> dict:
        """Create notification"""
        try:
            notification_id = str(uuid.uuid4())
            notification_ref = db.collection("notifications").document(notification_id)
            
            notification_doc = {
                **notification_data,
                "notification_id": notification_id,
                "userId": user_id,  # Changed from user_id to userId to match Firestore security rules
                "is_read": False,
                "created_at": datetime.utcnow(),
            }
            
            notification_ref.set(notification_doc)
            logger.info(f"Notification created: {notification_id} for user {user_id}")
            return notification_doc
        except Exception as e:
            logger.error(f"Create notification error: {e}")
            raise
    
    @staticmethod
    async def get_user_notifications(user_id: str, limit: int = 50, unread_only: bool = False, cursor: Optional[str] = None) -> List[dict]:
        """Get notifications for user with cursor pagination"""
        try:
            query = db.collection("notifications")\
                .where("userId", "==", user_id)  # Changed from user_id to userId
            
            if unread_only:
                query = query.where("is_read", "==", False)
            
            query = query.order_by("created_at", direction=firestore.Query.DESCENDING)\
                .limit(limit + 1)
            
            if cursor:
                cursor_doc = db.collection("notifications").document(cursor).get()
                if cursor_doc.exists:
                    query = query.start_after(cursor_doc)
            
            notifications_docs = list(query.stream())
            has_more = len(notifications_docs) > limit
            
            if has_more:
                notifications_docs = notifications_docs[:limit]
            
            notifications = [doc.to_dict() for doc in notifications_docs]
            
            return notifications
        except Exception as e:
            logger.error(f"Get user notifications error: {e}")
            return []
    
    @staticmethod
    async def mark_notification_read(notification_id: str, user_id: str) -> bool:
        """Mark notification as read"""
        try:
            notification_ref = db.collection("notifications").document(notification_id)
            notification = notification_ref.get()
            
            if not notification.exists:
                return False
            
            # Verify ownership - Changed from user_id to userId
            notification_data = notification.to_dict()
            if notification_data.get("userId") != user_id:
                logger.warning(f"User {user_id} attempted to mark notification {notification_id} belonging to another user")
                return False
            
            notification_ref.update({"is_read": True})
            logger.info(f"Notification {notification_id} marked as read")
            return True
        except Exception as e:
            logger.error(f"Mark notification read error: {e}")
            return False
    
    @staticmethod
    async def mark_all_notifications_read(user_id: str) -> bool:
        """Mark all notifications as read for user"""
        try:
            notifications_ref = db.collection("notifications")
            query = notifications_ref.where("userId", "==", user_id).where("is_read", "==", False).stream()  # Changed from user_id to userId
            
            batch = db.batch()
            count = 0
            
            for notification in query:
                batch.update(notification.reference, {"is_read": True})
                count += 1
                
                # Batch has limit of 500 operations
                if count >= 500:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            
            if count > 0:
                batch.commit()
            
            logger.info(f"Marked all notifications as read for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Mark all notifications read error: {e}")
            return False
    
    @staticmethod
    async def delete_notification(notification_id: str, user_id: str) -> bool:
        """Delete notification"""
        try:
            notification_ref = db.collection("notifications").document(notification_id)
            notification = notification_ref.get()
            
            if not notification.exists:
                return False
            
            # Verify ownership - Changed from user_id to userId
            notification_data = notification.to_dict()
            if notification_data.get("userId") != user_id:
                return False
            
            notification_ref.delete()
            logger.info(f"Notification {notification_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Delete notification error: {e}")
            return False
    
    @staticmethod
    async def check_notification_exists(user_id: str, notification_type: str, actor_id: str, post_id: Optional[str] = None) -> bool:
        """Check if similar notification already exists (prevent duplicates)"""
        try:
            query = db.collection("notifications")\
                .where("userId", "==", user_id)\
                .where("type", "==", notification_type)\
                .where("actor_id", "==", actor_id)
            
            if post_id:
                query = query.where("post_id", "==", post_id)
            
            # Check for notifications in last 5 minutes
            five_minutes_ago = datetime.utcnow().replace(microsecond=0) - __import__('datetime').timedelta(minutes=5)
            query = query.where("created_at", ">", five_minutes_ago)
            
            notifications = list(query.limit(1).stream())
            return len(notifications) > 0
        except Exception as e:
            logger.error(f"Check notification exists error: {e}")
            return False
    
    # ==================== SEARCH OPERATIONS ====================
    
    @staticmethod
    async def search_users(query: str, limit: int = 20) -> List[dict]:
        """Search users by username or full_name (case insensitive prefix matching)"""
        try:
            users = []
            query_lower = query.lower()
            
            # Search by username (prefix match)
            username_query = db.collection("users")\
                .where("username_lower", ">=", query_lower)\
                .where("username_lower", "<=", query_lower + "\uf8ff")\
                .limit(limit)\
                .stream()
            
            for user in username_query:
                user_data = user.to_dict()
                user_data["uid"] = user.id
                users.append(user_data)
            
            # If not enough results, search by full_name
            if len(users) < limit:
                name_query = db.collection("users")\
                    .where("full_name_lower", ">=", query_lower)\
                    .where("full_name_lower", "<=", query_lower + "\uf8ff")\
                    .limit(limit - len(users))\
                    .stream()
                
                existing_uids = {u["uid"] for u in users}
                
                for user in name_query:
                    if user.id not in existing_uids:
                        user_data = user.to_dict()
                        user_data["uid"] = user.id
                        users.append(user_data)
            
            logger.info(f"Search users: '{query}' returned {len(users)} results")
            return users[:limit]
        except Exception as e:
            logger.error(f"Search users error: {e}")
            return []
    
    @staticmethod
    async def search_posts(query: str, limit: int = 20) -> List[dict]:
        """Search posts by content (case insensitive)"""
        try:
            posts = []
            query_lower = query.lower()
            
            # Search by content (this is limited - in production use Algolia/ElasticSearch)
            # For now, get recent posts and filter in-memory
            recent_posts = db.collection("posts")\
                .order_by("created_at", direction=firestore.Query.DESCENDING)\
                .limit(200)\
                .stream()
            
            for post in recent_posts:
                post_data = post.to_dict()
                content = post_data.get("content", "").lower()
                
                # Simple search: check if query appears in content
                if query_lower in content:
                    posts.append(post_data)
                    
                    if len(posts) >= limit:
                        break
            
            logger.info(f"Search posts: '{query}' returned {len(posts)} results")
            return posts
        except Exception as e:
            logger.error(f"Search posts error: {e}")
            return []