from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class NotificationCreate(BaseModel):
    type: Literal["like", "comment", "message", "follow", "mention"]
    actor_id: str
    post_id: Optional[str] = None
    comment_id: Optional[str] = None
    message_preview: Optional[str] = None

class Notification(BaseModel):
    notification_id: str
    user_id: str  # receiver
    type: Literal["like", "comment", "message", "follow", "mention"]
    actor_id: str  # who triggered
    actor_username: Optional[str] = None
    actor_avatar: Optional[str] = None
    
    post_id: Optional[str] = None
    comment_id: Optional[str] = None
    message_preview: Optional[str] = None
    
    is_read: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    users: list = []
    posts: list = []
    total_users: int = 0
    total_posts: int = 0
