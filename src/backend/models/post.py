from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import datetime
import html
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from services.sanitizer import sanitize_plain_text
except ImportError:
    # Fallback if sanitizer not available
    def sanitize_plain_text(text, max_length=None):
        if not text:
            return ""
        cleaned = html.escape(text.strip())
        if max_length and len(cleaned) > max_length:
            cleaned = cleaned[:max_length]
        return cleaned

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    feed_type: Literal["entertainment", "career"]
    media_urls: List[str] = []
    media_type: Optional[Literal["image", "video", "none"]] = "none"
    hashtags: List[str] = []
    poll_options: Optional[List[str]] = None
    event_details: Optional[dict] = None
    
    @validator('content')
    def sanitize_content(cls, v):
        """Sanitize content to prevent XSS"""
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        # Use sanitizer to prevent XSS
        return sanitize_plain_text(v, max_length=2000)
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        """Validate hashtags"""
        if len(v) > 10:
            raise ValueError('Maximum 10 hashtags allowed')
        return [tag.strip() for tag in v if tag.strip()]

class Post(BaseModel):
    post_id: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    full_name: str
    
    content: str
    feed_type: Literal["entertainment", "career"]
    media_urls: List[str] = []
    media_type: Literal["image", "video", "none"] = "none"
    
    hashtags: List[str] = []
    
    # Engagement
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    bookmarks_count: int = 0
    
    # Poll
    poll_options: Optional[List[dict]] = None
    
    # Event
    event_details: Optional[dict] = None
    
    # Metadata
    is_verified_user: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    hashtags: Optional[List[str]] = None
    
    @validator('content')
    def sanitize_content(cls, v):
        """Sanitize content to prevent XSS"""
        if v is not None:
            if not v.strip():
                raise ValueError('Content cannot be empty')
            return sanitize_plain_text(v, max_length=2000)
        return v

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    
    @validator('content')
    def sanitize_content(cls, v):
        """Sanitize content to prevent XSS"""
        if not v or not v.strip():
            raise ValueError('Comment cannot be empty')
        # Use sanitizer to prevent XSS
        return sanitize_plain_text(v, max_length=500)

class Comment(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    full_name: str
    content: str
    likes_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentsResponse(BaseModel):
    """Response model for comments with pagination"""
    comments: List[Comment]
    next_cursor: Optional[str] = None
    has_more: bool = False