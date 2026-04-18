from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional, List
from ..models.chat import Message, MessageCreate, Conversation, ConversationWithUser, AIQuery, AIResponse
from ..services.firebase_service import FirebaseService
from ..services.auth_service import AuthService
from ..services.ai_service import ai_service

router = APIRouter(prefix="/chat", tags=["Chat"])

async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Get current user ID from auth header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    user = await AuthService.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user["uid"]

@router.get("/conversations", response_model=List[ConversationWithUser])
async def get_conversations(
    chat_type: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """Get all conversations for current user"""
    user_id = await get_current_user_id(authorization)
    
    conversations = await FirebaseService.get_conversations(user_id)
    
    # Filter by chat type if specified
    if chat_type:
        conversations = [c for c in conversations if c["chat_type"] == chat_type]
    
    # Enrich with other user's profile
    enriched = []
    for conv in conversations:
        other_user_id = [p for p in conv["participants"] if p != user_id][0]
        other_user = await FirebaseService.get_user(other_user_id)
        
        enriched.append({
            **conv,
            "other_user": other_user
        })
    
    return enriched

@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    receiver_id: str,
    chat_type: str = Query("casual"),
    authorization: Optional[str] = Header(None)
):
    """Create or get conversation with another user"""
    user_id = await get_current_user_id(authorization)
    
    if user_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")
    
    # Check if receiver exists
    receiver = await FirebaseService.get_user(receiver_id)
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversation = await FirebaseService.create_conversation([user_id, receiver_id], chat_type)
    return conversation

@router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    last_message_id: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Get messages in a conversation"""
    user_id = await get_current_user_id(authorization)
    
    messages = await FirebaseService.get_messages(conversation_id, limit, last_message_id)
    return messages

@router.post("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: str,
    authorization: Optional[str] = Header(None)
):
    """Mark all messages in conversation as read"""
    user_id = await get_current_user_id(authorization)
    
    success = await FirebaseService.mark_messages_as_read(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"message": "Messages marked as read"}

@router.post("/ai/query", response_model=AIResponse)
async def ai_career_query(
    query: AIQuery,
    authorization: Optional[str] = Header(None)
):
    """Query AI career assistant"""
    user_id = await get_current_user_id(authorization)
    user = await FirebaseService.get_user(user_id)
    response = await ai_service.get_career_advice(query.query, user)
    return {"response": response, "sources": None}

@router.post("/ai/smart-reply", response_model=AIResponse)
async def ai_smart_reply(
    query: AIQuery,
    authorization: Optional[str] = Header(None)
):
    """Generate smart replies for a conversation context"""
    user_id = await get_current_user_id(authorization)
    # query.query acts as our conversation context
    replies = await ai_service.generate_smart_responses(query.query)
    # Join list into a single string for transport
    return {"response": "\n".join(replies), "sources": None}

@router.post("/ai/professional", response_model=AIResponse)
async def ai_professional(
    query: AIQuery,
    authorization: Optional[str] = Header(None)
):
    """Rewrite message to be more professional"""
    user_id = await get_current_user_id(authorization)
    response = await ai_service.rewrite_professional(query.query)
    return {"response": response, "sources": None}

@router.post("/ai/improve", response_model=AIResponse)
async def ai_improve(
    query: AIQuery,
    authorization: Optional[str] = Header(None)
):
    """Improve grammar and clarity of the message"""
    user_id = await get_current_user_id(authorization)
    response = await ai_service.improve_message(query.query)
    return {"response": response, "sources": None}

@router.post("/ai/ask", response_model=AIResponse)
async def ai_ask(
    query: AIQuery,
    authorization: Optional[str] = Header(None)
):
    """Ask AI assistant for chat help"""
    user_id = await get_current_user_id(authorization)
    response = await ai_service.ask_ai_assistant(query.query)
    return {"response": response, "sources": None}
