from typing import Dict, Set, List
from fastapi import WebSocket
import json
from datetime import datetime
import asyncio

class ConnectionManager:
    """Manage WebSocket connections for real-time chat"""
    
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
        # conversation_id -> set of user_ids
        self.conversation_participants: Dict[str, Set[str]] = {}
        
        # Track connection metadata
        self.connection_metadata: Dict[str, dict] = {}
        
        # Message queue for offline users
        self.offline_message_queue: Dict[str, List[dict]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        
        # Store connection metadata
        self.connection_metadata[user_id] = {
            "connected_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat()
        }
        
        # Send queued offline messages
        await self.send_queued_messages(user_id)
        
        print(f"✅ User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user if no connections left
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.connection_metadata:
                    del self.connection_metadata[user_id]
        
        print(f"❌ User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    # Update last activity
                    if user_id in self.connection_metadata:
                        self.connection_metadata[user_id]["last_activity"] = datetime.utcnow().isoformat()
                except Exception as e:
                    print(f"Error sending to {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected sockets
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
        else:
            # Queue message for offline user
            await self.queue_message(user_id, message)
    
    async def broadcast_to_conversation(self, message: dict, conversation_id: str, exclude_user: str = None):
        """Broadcast message to all participants in a conversation"""
        if conversation_id in self.conversation_participants:
            tasks = []
            for user_id in self.conversation_participants[conversation_id]:
                if user_id != exclude_user:
                    tasks.append(self.send_personal_message(message, user_id))
            
            # Send all messages concurrently
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_to_users(self, message: dict, user_ids: List[str], exclude_user: str = None):
        """Broadcast message to specific list of users"""
        tasks = []
        for user_id in user_ids:
            if user_id != exclude_user:
                tasks.append(self.send_personal_message(message, user_id))
        
        # Send all messages concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        tasks = []
        for user_id in self.active_connections.keys():
            tasks.append(self.send_personal_message(message, user_id))
        
        # Send all messages concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def join_conversation(self, user_id: str, conversation_id: str):
        """Add user to conversation participants"""
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        
        self.conversation_participants[conversation_id].add(user_id)
        print(f"✅ User {user_id} joined conversation {conversation_id}")
    
    def leave_conversation(self, user_id: str, conversation_id: str):
        """Remove user from conversation participants"""
        if conversation_id in self.conversation_participants:
            self.conversation_participants[conversation_id].discard(user_id)
            
            # Clean up empty conversations
            if not self.conversation_participants[conversation_id]:
                del self.conversation_participants[conversation_id]
            
            print(f"❌ User {user_id} left conversation {conversation_id}")
    
    def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of active connections for a user"""
        if user_id in self.active_connections:
            return len(self.active_connections[user_id])
        return 0
    
    def get_conversation_participants(self, conversation_id: str) -> Set[str]:
        """Get all participants in a conversation"""
        return self.conversation_participants.get(conversation_id, set())
    
    def get_active_connections_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_connection_metadata(self, user_id: str) -> dict:
        """Get connection metadata for a user"""
        return self.connection_metadata.get(user_id, {})
    
    async def queue_message(self, user_id: str, message: dict):
        """Queue message for offline user"""
        if user_id not in self.offline_message_queue:
            self.offline_message_queue[user_id] = []
        
        # Add timestamp
        message["queued_at"] = datetime.utcnow().isoformat()
        self.offline_message_queue[user_id].append(message)
        
        # Limit queue size to prevent memory issues
        if len(self.offline_message_queue[user_id]) > 100:
            self.offline_message_queue[user_id] = self.offline_message_queue[user_id][-100:]
    
    async def send_queued_messages(self, user_id: str):
        """Send all queued messages to user"""
        if user_id in self.offline_message_queue:
            messages = self.offline_message_queue[user_id]
            
            if messages:
                # Send queued messages notification
                await self.send_personal_message({
                    "type": "queued_messages",
                    "count": len(messages),
                    "messages": messages
                }, user_id)
                
                # Clear queue
                del self.offline_message_queue[user_id]

# Global connection manager instance
manager = ConnectionManager()