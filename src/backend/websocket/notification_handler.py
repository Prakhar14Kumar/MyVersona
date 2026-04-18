from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
import json
from datetime import datetime
from .connection_manager import manager
from ..services.firebase_service import FirebaseService

class NotificationHandler:
    """Handle WebSocket notifications for real-time updates"""
    
    @staticmethod
    async def handle_connection(websocket: WebSocket, user_id: str):
        """Handle WebSocket connection lifecycle for notifications"""
        await manager.connect(websocket, user_id)
        
        try:
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_established",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "connection_type": "notifications"
            })
            
            # Send pending notifications
            await NotificationHandler.send_pending_notifications(user_id)
            
            # Handle incoming messages
            while True:
                data = await websocket.receive_text()
                await NotificationHandler.handle_message(data, user_id)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
            print(f"❌ User {user_id} disconnected from notifications")
        except Exception as e:
            print(f"WebSocket error for user {user_id}: {e}")
            manager.disconnect(websocket, user_id)
    
    @staticmethod
    async def handle_message(message_data: str, user_id: str):
        """Process incoming WebSocket notification messages"""
        try:
            data = json.loads(message_data)
            message_type = data.get("type")
            
            if message_type == "mark_read":
                await NotificationHandler.mark_notification_read(data, user_id)
            
            elif message_type == "mark_all_read":
                await NotificationHandler.mark_all_notifications_read(user_id)
            
            elif message_type == "clear_notification":
                await NotificationHandler.clear_notification(data, user_id)
            
            elif message_type == "ping":
                # Keep-alive ping
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, user_id)
            
            else:
                print(f"Unknown notification message type: {message_type}")
        
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Notification message handling error: {e}")
    
    @staticmethod
    async def send_pending_notifications(user_id: str):
        """Send all pending notifications to user"""
        try:
            notifications = await FirebaseService.get_user_notifications(user_id, unread_only=True)
            
            if notifications:
                await manager.send_personal_message({
                    "type": "pending_notifications",
                    "notifications": notifications,
                    "count": len(notifications)
                }, user_id)
        
        except Exception as e:
            print(f"Error sending pending notifications: {e}")
    
    @staticmethod
    async def send_notification(user_id: str, notification: Dict[str, Any]):
        """Send a new notification to user"""
        try:
            # Save notification to Firebase
            saved_notification = await FirebaseService.create_notification(user_id, notification)
            
            # Send via WebSocket if user is online
            await manager.send_personal_message({
                "type": "new_notification",
                "notification": saved_notification
            }, user_id)
        
        except Exception as e:
            print(f"Error sending notification: {e}")
    
    @staticmethod
    async def mark_notification_read(data: dict, user_id: str):
        """Mark specific notification as read"""
        try:
            notification_id = data.get("notification_id")
            
            if not notification_id:
                return
            
            await FirebaseService.mark_notification_read(notification_id, user_id)
            
            # Send confirmation
            await manager.send_personal_message({
                "type": "notification_read",
                "notification_id": notification_id
            }, user_id)
        
        except Exception as e:
            print(f"Mark notification read error: {e}")
    
    @staticmethod
    async def mark_all_notifications_read(user_id: str):
        """Mark all notifications as read"""
        try:
            await FirebaseService.mark_all_notifications_read(user_id)
            
            # Send confirmation
            await manager.send_personal_message({
                "type": "all_notifications_read"
            }, user_id)
        
        except Exception as e:
            print(f"Mark all notifications read error: {e}")
    
    @staticmethod
    async def clear_notification(data: dict, user_id: str):
        """Clear/delete a notification"""
        try:
            notification_id = data.get("notification_id")
            
            if not notification_id:
                return
            
            await FirebaseService.delete_notification(notification_id, user_id)
            
            # Send confirmation
            await manager.send_personal_message({
                "type": "notification_cleared",
                "notification_id": notification_id
            }, user_id)
        
        except Exception as e:
            print(f"Clear notification error: {e}")
    
    @staticmethod
    async def broadcast_post_notification(post_data: dict, followers: list):
        """Broadcast new post notification to all followers"""
        try:
            for follower_id in followers:
                notification = {
                    "type": "new_post",
                    "post_id": post_data.get("post_id"),
                    "user_id": post_data.get("user_id"),
                    "username": post_data.get("username"),
                    "message": f"{post_data.get('username')} posted something new",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await NotificationHandler.send_notification(follower_id, notification)
        
        except Exception as e:
            print(f"Broadcast post notification error: {e}")
    
    @staticmethod
    async def send_like_notification(post_owner_id: str, liker_data: dict):
        """Send notification when someone likes a post"""
        try:
            notification = {
                "type": "post_like",
                "user_id": liker_data.get("user_id"),
                "username": liker_data.get("username"),
                "post_id": liker_data.get("post_id"),
                "message": f"{liker_data.get('username')} liked your post",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await NotificationHandler.send_notification(post_owner_id, notification)
        
        except Exception as e:
            print(f"Send like notification error: {e}")
    
    @staticmethod
    async def send_comment_notification(post_owner_id: str, commenter_data: dict):
        """Send notification when someone comments on a post"""
        try:
            notification = {
                "type": "post_comment",
                "user_id": commenter_data.get("user_id"),
                "username": commenter_data.get("username"),
                "post_id": commenter_data.get("post_id"),
                "comment": commenter_data.get("comment"),
                "message": f"{commenter_data.get('username')} commented on your post",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await NotificationHandler.send_notification(post_owner_id, notification)
        
        except Exception as e:
            print(f"Send comment notification error: {e}")
    
    @staticmethod
    async def send_follow_notification(followed_user_id: str, follower_data: dict):
        """Send notification when someone follows a user"""
        try:
            notification = {
                "type": "new_follower",
                "user_id": follower_data.get("user_id"),
                "username": follower_data.get("username"),
                "message": f"{follower_data.get('username')} started following you",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await NotificationHandler.send_notification(followed_user_id, notification)
        
        except Exception as e:
            print(f"Send follow notification error: {e}")

# Export handler
notification_handler = NotificationHandler()
