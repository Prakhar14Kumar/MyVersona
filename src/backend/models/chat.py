from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

class MessageCreate(BaseModel):
    content: str
    chat_type: Literal["casual", "professional"]
    receiver_id: str
    media_url: Optional[str] = None
    media_type: Optional[Literal["image", "video", "file"]] = None

class Message(BaseModel):
    message_id: str
    conversation_id: str
    sender_id: str
    receiver_id: str
    content: str
    chat_type: Literal["casual", "professional"]
    
    media_url: Optional[str] = None
    media_type: Optional[Literal["image", "video", "file"]] = None
    
    is_read: bool = False
    is_deleted: bool = False
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Conversation(BaseModel):
    conversation_id: str
    participants: List[str]
    chat_type: Literal["casual", "professional"]
    
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_sender_id: Optional[str] = None
    
    unread_count: dict = {}  # {user_id: count}
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConversationWithUser(Conversation):
    other_user: dict  # User profile of the other participant
    
class AIQuery(BaseModel):
    query: str
    context: Optional[str] = None

class AIResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
