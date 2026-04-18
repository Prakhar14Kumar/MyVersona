from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from ..core.auth.decorators import get_current_user
from ..services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/users")
async def search_users(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Search users by username or full name
    
    - **q**: Search query (case insensitive)
    - **limit**: Maximum number of results (max 50)
    """
    try:
        if not q or len(q.strip()) == 0:
            return {
                "success": True,
                "users": [],
                "count": 0,
                "query": q
            }
        
        users = await FirebaseService.search_users(q.strip(), limit)
        
        # Remove sensitive fields
        safe_users = []
        for user in users:
            safe_user = {
                "uid": user.get("uid"),
                "username": user.get("username"),
                "full_name": user.get("full_name"),
                "avatar_url": user.get("avatar_url"),
                "bio": user.get("bio"),
                "college_name": user.get("college_name"),
                "branch": user.get("branch"),
                "year": user.get("year"),
                "is_verified": user.get("is_verified", False),
                "followers_count": user.get("followers_count", 0),
            }
            safe_users.append(safe_user)
        
        return {
            "success": True,
            "users": safe_users,
            "count": len(safe_users),
            "query": q
        }
    except Exception as e:
        logger.error(f"Search users error: {e}")
        raise HTTPException(status_code=500, detail="Failed to search users")

@router.get("/posts")
async def search_posts(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Search posts by content
    
    - **q**: Search query (case insensitive)
    - **limit**: Maximum number of results (max 50)
    
    Note: This is a basic search implementation. For production,
    consider using Algolia, ElasticSearch, or similar for better performance.
    """
    try:
        if not q or len(q.strip()) == 0:
            return {
                "success": True,
                "posts": [],
                "count": 0,
                "query": q
            }
        
        posts = await FirebaseService.search_posts(q.strip(), limit)
        
        return {
            "success": True,
            "posts": posts,
            "count": len(posts),
            "query": q
        }
    except Exception as e:
        logger.error(f"Search posts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to search posts")

@router.get("")
async def search_all(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    users_limit: int = Query(10, le=20),
    posts_limit: int = Query(10, le=20),
    current_user: dict = Depends(get_current_user)
):
    """
    Search both users and posts
    
    - **q**: Search query (case insensitive)
    - **users_limit**: Maximum number of user results
    - **posts_limit**: Maximum number of post results
    """
    try:
        if not q or len(q.strip()) == 0:
            return {
                "success": True,
                "users": [],
                "posts": [],
                "total_users": 0,
                "total_posts": 0,
                "query": q
            }
        
        # Search users and posts concurrently
        import asyncio
        
        users_task = FirebaseService.search_users(q.strip(), users_limit)
        posts_task = FirebaseService.search_posts(q.strip(), posts_limit)
        
        users, posts = await asyncio.gather(users_task, posts_task)
        
        # Remove sensitive fields from users
        safe_users = []
        for user in users:
            safe_user = {
                "uid": user.get("uid"),
                "username": user.get("username"),
                "full_name": user.get("full_name"),
                "avatar_url": user.get("avatar_url"),
                "bio": user.get("bio"),
                "college_name": user.get("college_name"),
                "branch": user.get("branch"),
                "year": user.get("year"),
                "is_verified": user.get("is_verified", False),
                "followers_count": user.get("followers_count", 0),
            }
            safe_users.append(safe_user)
        
        return {
            "success": True,
            "users": safe_users,
            "posts": posts,
            "total_users": len(safe_users),
            "total_posts": len(posts),
            "query": q
        }
    except Exception as e:
        logger.error(f"Search all error: {e}")
        raise HTTPException(status_code=500, detail="Failed to search")
