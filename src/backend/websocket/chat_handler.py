from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional
import json
from datetime import datetime
import logging

from src.backend.websocket.connection_manager import manager

from src.backend.services.firebase_service import FirebaseService
from src.backend.services.ai_service import ai_service
from src.backend.services.postgres_chat_service import PostgresChatService
from src.backend.services.auth_service import AuthService

from src.backend.core.websocket.spam_protection import spam_protection

from src.backend.websocket.notification_handler import notification_handler

logger = logging.getLogger(__name__)
logger = logging.getLogger(__name__)

class ChatHandler:
    """Handle WebSocket chat messages with JWT auth and spam protection"""
    
    @staticmethod
    async def authenticate_websocket(websocket: WebSocket, receiver_id: str) -> Optional[dict]:
        """Authenticate WebSocket connection and validate sender/receiver"""
        try:
            # 1. Extract Token
            token = websocket.query_params.get("token")
            if not token:
                print(f"❌ [WebSocket] Connection attempt without token (receiver: {receiver_id})")
                return None
            
            # 2. Verify Firebase User
            decoded = await AuthService.verify_firebase_token(token)
            if not decoded or not decoded.get("uid"):
                print(f"❌ [WebSocket] Auth failed: Invalid or missing Firebase token")
                return None
                
            sender_id = decoded.get("uid")
            print(f"🔑 [WebSocket] Authenticated Sender: {sender_id} | Target Receiver: {receiver_id}")
            
            # 3. Ensure sender != receiver
            if sender_id == receiver_id:
                print(f"❌ [WebSocket] Auth failed: sender_id ({sender_id}) cannot match receiver_id")
                return None

            # 4. Verify both users exist in Postgres DB (bypass for AI)
            from src.backend.services.postgres_user_service import PostgresUserService
            from src.backend.core.database import AsyncSessionLocal
            from sqlalchemy.future import select
            from src.backend.models.user_models import User
            
            async with AsyncSessionLocal() as session:
                sender = (await session.execute(select(User).where(User.id == sender_id))).scalars().first()
                if not sender:
                    print(f"❌ [WebSocket] Auth failed: Sender {sender_id} not found in DB")
                    return None
                
                if receiver_id != "versona-ai":
                    receiver = (await session.execute(select(User).where(User.id == receiver_id))).scalars().first()
                    if not receiver:
                        print(f"❌ [WebSocket] Auth failed: Receiver {receiver_id} not found in DB")
                        return None
                    
            print(f"✅ [WebSocket] Auth successful. Session verified for {sender_id} -> {receiver_id}")
            return {"sender_id": sender_id, "receiver_id": receiver_id}

        except Exception as e:
            print(f"❌ [WebSocket] Unexpected auth error: {e}")
            return None

    @staticmethod
    async def handle_connection(websocket: WebSocket, receiver_id: str):
        """Handle WebSocket connection lifecycle"""
        print(f"🔄 [WebSocket] Incoming connection. Authenticating...")
        
        # Authenticate connection
        auth_data = await ChatHandler.authenticate_websocket(websocket, receiver_id)
        
        if not auth_data:
            print(f"🚫 [WebSocket] Authentication failed. Closing connection.")
            await websocket.close(code=1008, reason="Authentication failed")
            return
            
        sender_id = auth_data["sender_id"]
        
        # Maintain active connection mapped to the SENDER
        await manager.connect(websocket, sender_id)
        print(f"🟢 [WebSocket] User {sender_id} actively connected and listening for messages.")
        
        try:
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_established",
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Message listening loop
            while True:
                data = await websocket.receive_text()
                parsed_data = json.loads(data)
                print(f"📨 [WebSocket] Message received from {sender_id}: {parsed_data}")
                
                # Delegate to your message processing logic
                await ChatHandler.handle_message(data, sender_id)
                
        except WebSocketDisconnect:
            print(f"🔴 [WebSocket] User {sender_id} disconnected normally.")
            manager.disconnect(websocket, sender_id)
        except Exception as e:
            print(f"❌ [WebSocket] Connection error for {sender_id}: {e}")
            manager.disconnect(websocket, sender_id)
    
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
            if not conversation_id or conversation_id.startswith("temp-"):
                conversation = await FirebaseService.create_conversation(
                    [sender_id, receiver_id],
                    chat_type
                )
                conversation_id = conversation["conversation_id"]
            
            # Save message to Postgres
            message = await PostgresChatService.save_message(
                conversation_id=conversation_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content,
                chat_type=chat_type
            )
            
            # Update Firebase to trigger onSnapshot listeners for sidebars
            try:
                await FirebaseService.send_message(conversation_id, {
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content
                })
            except Exception as fb_err:
                print(f"Firebase sync error: {fb_err}")
            
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
            
            # Mark messages as read in Postgres
            await PostgresChatService.mark_as_read(conversation_id, sender_id)
            
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