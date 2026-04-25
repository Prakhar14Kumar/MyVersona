from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    uid: str
    email: str
    username: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    phone: Optional[str] = None
    public_key: Optional[str] = None
    
    # Professional Info
    college_name: Optional[str] = None
    college_hashtag: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    
    # Social Links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Stats
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    
    # Verification
    is_verified: bool = False
    is_mentor: bool = False
    is_recruiter: bool = False
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    phone: Optional[str] = None
    public_key: Optional[str] = None
    college_name: Optional[str] = None
    college_hashtag: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
