from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List
import json
from datetime import datetime, timedelta
from .connection_manager import manager
from ..services.firebase_service import FirebaseService

class PresenceHandler:
    """Handle user presence and online status"""
    
    def __init__(self):
        # Track user online status
        self.user_status: Dict[str, dict] = {}
        
        # Track user activities (typing, viewing, etc.)
        self.user_activities: Dict[str, dict] = {}
    
    async def handle_connection(self, websocket: WebSocket, user_id: str):
        """Handle WebSocket connection for presence"""
        await manager.connect(websocket, user_id)
        
        try:
            # Update user online status
            await self.set_user_online(user_id)
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_established",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "connection_type": "presence"
            })
            
            # Handle incoming messages
            while True:
                data = await websocket.receive_text()
                await self.handle_message(data, user_id)
                
        except WebSocketDisconnect:
            await self.set_user_offline(user_id)
            manager.disconnect(websocket, user_id)
        except Exception as e:
            print(f"Presence WebSocket error for user {user_id}: {e}")
            await self.set_user_offline(user_id)
            manager.disconnect(websocket, user_id)
    
    async def handle_message(self, message_data: str, user_id: str):
        """Process incoming presence messages"""
        try:
            data = json.loads(message_data)
            message_type = data.get("type")
            
            if message_type == "heartbeat":
                await self.update_heartbeat(user_id)
            
            elif message_type == "status_update":
                await self.update_user_status(user_id, data)
            
            elif message_type == "activity":
                await self.update_user_activity(user_id, data)
            
            elif message_type == "check_status":
                await self.check_users_status(user_id, data)
            
            else:
                print(f"Unknown presence message type: {message_type}")
        
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Presence message handling error: {e}")
    
    async def set_user_online(self, user_id: str):
        """Set user as online"""
        try:
            self.user_status[user_id] = {
                "status": "online",
                "last_seen": datetime.utcnow().isoformat(),
                "custom_status": None
            }
            
            # Update in Firebase
            await FirebaseService.update_user_presence(user_id, {
                "is_online": True,
                "last_seen": datetime.utcnow().isoformat()
            })
            
            # Notify friends about online status
            await self.broadcast_status_change(user_id, "online")
        
        except Exception as e:
            print(f"Set user online error: {e}")
    
    async def set_user_offline(self, user_id: str):
        """Set user as offline"""
        try:
            if user_id in self.user_status:
                self.user_status[user_id]["status"] = "offline"
                self.user_status[user_id]["last_seen"] = datetime.utcnow().isoformat()
            
            # Update in Firebase
            await FirebaseService.update_user_presence(user_id, {
                "is_online": False,
                "last_seen": datetime.utcnow().isoformat()
            })
            
            # Notify friends about offline status
            await self.broadcast_status_change(user_id, "offline")
        
        except Exception as e:
            print(f"Set user offline error: {e}")
    
    async def update_heartbeat(self, user_id: str):
        """Update user heartbeat"""
        try:
            if user_id in self.user_status:
                self.user_status[user_id]["last_seen"] = datetime.utcnow().isoformat()
            
            # Send acknowledgment
            await manager.send_personal_message({
                "type": "heartbeat_ack",
                "timestamp": datetime.utcnow().isoformat()
            }, user_id)
        
        except Exception as e:
            print(f"Update heartbeat error: {e}")
    
    async def update_user_status(self, user_id: str, data: dict):
        """Update user custom status"""
        try:
            custom_status = data.get("status")
            
            if user_id in self.user_status:
                self.user_status[user_id]["custom_status"] = custom_status
            
            # Update in Firebase
            await FirebaseService.update_user_status(user_id, custom_status)
            
            # Notify friends about status change
            await self.broadcast_status_change(user_id, "status_update", custom_status)
        
        except Exception as e:
            print(f"Update user status error: {e}")
    
    async def update_user_activity(self, user_id: str, data: dict):
        """Update user activity (typing, viewing, etc.)"""
        try:
            activity_type = data.get("activity_type")
            target_id = data.get("target_id")  # conversation_id, post_id, etc.
            is_active = data.get("is_active", True)
            
            if is_active:
                self.user_activities[user_id] = {
                    "activity_type": activity_type,
                    "target_id": target_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                if user_id in self.user_activities:
                    del self.user_activities[user_id]
            
            # Broadcast activity to relevant users
            await self.broadcast_activity(user_id, activity_type, target_id, is_active)
        
        except Exception as e:
            print(f"Update user activity error: {e}")
    
    async def check_users_status(self, user_id: str, data: dict):
        """Check status of multiple users"""
        try:
            user_ids = data.get("user_ids", [])
            
            statuses = {}
            for uid in user_ids:
                if uid in self.user_status:
                    statuses[uid] = self.user_status[uid]
                else:
                    # Fetch from Firebase if not in memory
                    user_data = await FirebaseService.get_user_presence(uid)
                    if user_data:
                        statuses[uid] = user_data
            
            # Send status information
            await manager.send_personal_message({
                "type": "users_status",
                "statuses": statuses
            }, user_id)
        
        except Exception as e:
            print(f"Check users status error: {e}")
    
    async def broadcast_status_change(self, user_id: str, status_type: str, custom_status: str = None):
        """Broadcast user status change to friends"""
        try:
            # Get user's friends/followers
            friends = await FirebaseService.get_user_friends(user_id)
            
            message = {
                "type": "user_status_change",
                "user_id": user_id,
                "status_type": status_type,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if custom_status:
                message["custom_status"] = custom_status
            
            if status_type == "online":
                message["status"] = "online"
            elif status_type == "offline":
                message["status"] = "offline"
                if user_id in self.user_status:
                    message["last_seen"] = self.user_status[user_id]["last_seen"]
            
            # Send to all online friends
            for friend_id in friends:
                if manager.is_user_online(friend_id):
                    await manager.send_personal_message(message, friend_id)
        
        except Exception as e:
            print(f"Broadcast status change error: {e}")
    
    async def broadcast_activity(self, user_id: str, activity_type: str, target_id: str, is_active: bool):
        """Broadcast user activity to relevant users"""
        try:
            message = {
                "type": "user_activity",
                "user_id": user_id,
                "activity_type": activity_type,
                "target_id": target_id,
                "is_active": is_active,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Determine who should receive this activity update
            if activity_type == "typing":
                # Send to conversation participants
                conversation = await FirebaseService.get_conversation(target_id)
                if conversation:
                    for participant_id in conversation.get("participants", []):
                        if participant_id != user_id and manager.is_user_online(participant_id):
                            await manager.send_personal_message(message, participant_id)
            
            elif activity_type == "viewing_profile":
                # Send to the profile owner
                if manager.is_user_online(target_id):
                    await manager.send_personal_message(message, target_id)
        
        except Exception as e:
            print(f"Broadcast activity error: {e}")
    
    def get_user_status(self, user_id: str) -> dict:
        """Get current status of a user"""
        return self.user_status.get(user_id, {
            "status": "offline",
            "last_seen": None,
            "custom_status": None
        })
    
    def get_online_users(self) -> List[str]:
        """Get list of all online users"""
        return [
            user_id for user_id, status in self.user_status.items()
            if status["status"] == "online"
        ]
    
    def get_user_activity(self, user_id: str) -> dict:
        """Get current activity of a user"""
        return self.user_activities.get(user_id, None)

# Export handler
presence_handler = PresenceHandler()
