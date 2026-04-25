from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional
import json
from datetime import datetime
import logging

from src.backend.websocket.connection_manager import manager

from src.backend.services.firebase_service import FirebaseService
from src.backend.services.ai_service import ai_service
from src.backend.services.auth_service import AuthService

from src.backend.core.websocket.spam_protection import spam_protection

from src.backend.websocket.notification_handler import notification_handler

logger = logging.getLogger(__name__)
logger = logging.getLogger(__name__)

class ChatHandler:
    """Handle WebSocket chat messages with JWT auth and spam protection"""
    
    @staticmethod
    async def authenticate_websocket(websocket: WebSocket, user_id: str) -> Optional[dict]:
        """
        Authenticate WebSocket connection using query parameter token
        
        Returns:
            User dict if authenticated, None otherwise
        """
        try:
            # Get token from query params
            token = websocket.query_params.get("token")
            
            if not token:
                logger.warning(f"WebSocket connection attempt without token for user {user_id}")
                return None
            
            # Validate via Firebase since React uses Firebase getIdToken()
            decoded = await AuthService.verify_firebase_token(token)
            
            if not decoded or decoded.get("uid") != user_id:
                logger.warning(f"WebSocket auth failed: token user mismatch for {user_id}")
                return None
                
            # Fetch user details
            user = await FirebaseService.get_user(user_id)
            if not user:
                logger.warning(f"WebSocket auth failed: User missing in Firestore")
                return None
                
            return user
        except Exception as e:
            logger.error(f"WebSocket auth error: {e}")
            return None
    
    @staticmethod
    async def handle_connection(websocket: WebSocket, user_id: str):
        """Handle WebSocket connection lifecycle with JWT auth"""
        # Authenticate connection
        user = await ChatHandler.authenticate_websocket(websocket, user_id)
        
        if not user:
            await websocket.close(code=1008, reason="Authentication failed")
            return
        
        await manager.connect(websocket, user_id)
        
        try:
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_established",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Handle incoming messages
            while True:
                data = await websocket.receive_text()
                await ChatHandler.handle_message(data, user_id)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
        except Exception as e:
            print(f"WebSocket error for user {user_id}: {e}")
            manager.disconnect(websocket, user_id)
    
    @staticmethod
    async def handle_message(message_data: str, sender_id: str):
        """Process incoming WebSocket message"""
        try:
            data = json.loads(message_data)
            message_type = data.get("type")
            
            if message_type == "send_message":
                await ChatHandler.handle_send_message(data, sender_id)
            
            elif message_type == "typing":
                await ChatHandler.handle_typing(data, sender_id)
            
            elif message_type == "read_receipt":
                await ChatHandler.handle_read_receipt(data, sender_id)
            
            elif message_type == "join_conversation":
                await ChatHandler.handle_join_conversation(data, sender_id)
            
            elif message_type == "leave_conversation":
                await ChatHandler.handle_leave_conversation(data, sender_id)
            
            elif message_type == "ai_query":
                await ChatHandler.handle_ai_query(data, sender_id)
            
            elif message_type in ("ping", "heartbeat"):
                # Keep-alive ping/heartbeat
                await manager.send_personal_message({
                    "type": "pong" if message_type == "ping" else "heartbeat_ack",
                    "timestamp": datetime.utcnow().isoformat()
                }, sender_id)
            
            else:
                print(f"Unknown message type: {message_type}")
        
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Message handling error: {e}")
    
    @staticmethod
    async def handle_send_message(data: dict, sender_id: str):
        """Handle sending a chat message"""
        try:
            receiver_id = data.get("receiver_id")
            content = data.get("content")
            chat_type = data.get("chat_type", "casual")
            conversation_id = data.get("conversation_id")
            
            if not receiver_id or not content:
                return
            
            # Get or create conversation
            if not conversation_id:
                conversation = await FirebaseService.create_conversation(
                    [sender_id, receiver_id],
                    chat_type
                )
                conversation_id = conversation["conversation_id"]
            
            # Save message to Firebase
            message = await FirebaseService.send_message(
                conversation_id,
                {
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "chat_type": chat_type,
                    "media_url": data.get("media_url"),
                    "media_type": data.get("media_type"),
                }
            )
            
            # Send to receiver via WebSocket
            await manager.send_personal_message({
                "type": "new_message",
                "message": message,
                "conversation_id": conversation_id
            }, receiver_id)
            
            # Send confirmation to sender
            await manager.send_personal_message({
                "type": "message_sent",
                "message": message,
                "conversation_id": conversation_id
            }, sender_id)
            
        except Exception as e:
            print(f"Send message error: {e}")
            await manager.send_personal_message({
                "type": "error",
                "message": "Failed to send message"
            }, sender_id)
    
    @staticmethod
    async def handle_typing(data: dict, sender_id: str):
        """Handle typing indicator"""
        try:
            receiver_id = data.get("receiver_id")
            conversation_id = data.get("conversation_id")
            is_typing = data.get("is_typing", True)
            
            if not receiver_id:
                return
            
            await manager.send_personal_message({
                "type": "typing",
                "sender_id": sender_id,
                "conversation_id": conversation_id,
                "is_typing": is_typing
            }, receiver_id)
            
        except Exception as e:
            print(f"Typing indicator error: {e}")
    
    @staticmethod
    async def handle_read_receipt(data: dict, sender_id: str):
        """Handle message read receipt"""
        try:
            conversation_id = data.get("conversation_id")
            
            if not conversation_id:
                return
            
            # Mark messages as read in Firebase
            await FirebaseService.mark_messages_as_read(conversation_id, sender_id)
            
            # Notify other participants
            conversation = await FirebaseService.get_conversation(conversation_id)
            if conversation:
                for participant in conversation["participants"]:
                    if participant != sender_id:
                        await manager.send_personal_message({
                            "type": "messages_read",
                            "conversation_id": conversation_id,
                            "read_by": sender_id
                        }, participant)
            
        except Exception as e:
            print(f"Read receipt error: {e}")
    
    @staticmethod
    async def handle_join_conversation(data: dict, user_id: str):
        """Handle user joining a conversation"""
        try:
            conversation_id = data.get("conversation_id")
            
            if not conversation_id:
                return
            
            manager.join_conversation(user_id, conversation_id)
            
            # Send confirmation
            await manager.send_personal_message({
                "type": "joined_conversation",
                "conversation_id": conversation_id
            }, user_id)
            
        except Exception as e:
            print(f"Join conversation error: {e}")
    
    @staticmethod
    async def handle_leave_conversation(data: dict, user_id: str):
        """Handle user leaving a conversation"""
        try:
            conversation_id = data.get("conversation_id")
            
            if not conversation_id:
                return
            
            manager.leave_conversation(user_id, conversation_id)
            
        except Exception as e:
            print(f"Leave conversation error: {e}")
    
    @staticmethod
    async def handle_ai_query(data: dict, user_id: str):
        """Handle AI career assistant query"""
        try:
            query = data.get("query")
            
            if not query:
                return
            
            # Get user profile for context
            user = await FirebaseService.get_user(user_id)
            
            # Format prompt for smart conversational replies
            prompt = f"Based on this conversation context: '{query}', suggest 3 distinct, short, conversational follow-up replies that the user can pick from. Format each as a bullet point. No extra text."
            
            # Get AI response via existing function
            response = await ai_service.get_career_advice(prompt, user)
            
            # Send response
            await manager.send_personal_message({
                "type": "ai_response",
                "query": query,
                "response": response,
                "timestamp": datetime.utcnow().isoformat()
            }, user_id)
            
        except Exception as e:
            print(f"AI query error: {e}")
            await manager.send_personal_message({
                "type": "error",
                "message": "AI service is currently unavailable"
            }, user_id)

# Export handler
chat_handler = ChatHandler()