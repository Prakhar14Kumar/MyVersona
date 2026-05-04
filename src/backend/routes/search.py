from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from core.auth.decorators import get_current_user
from services.firebase_service import FirebaseService
from services.algolia_service import algolia_service
from core.dependencies import get_current_user_id as auth_get_current_user_id


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
        
        if algolia_service.client:
            # Algolia Search
            results = algolia_service.users_index.search(q.strip(), {"hitsPerPage": limit})
            users = results.get("hits", [])
        else:
            # Fallback to Firebase
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
        
        if algolia_service.client:
            # Algolia Search
            results = algolia_service.posts_index.search(q.strip(), {"hitsPerPage": limit})
            posts = results.get("hits", [])
        else:
            # Fallback to Firebase
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
        
        if algolia_service.client:
            users_res = algolia_service.users_index.search(q.strip(), {"hitsPerPage": users_limit})
            posts_res = algolia_service.posts_index.search(q.strip(), {"hitsPerPage": posts_limit})
            users = users_res.get("hits", [])
            posts = posts_res.get("hits", [])
        else:
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

@router.get("/hashtags/trending")
async def get_trending_hashtags(
    limit: int = Query(10, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get top trending hashtags"""
    try:
        hashtags = algolia_service.get_trending_hashtags(limit)
        return {
            "success": True,
            "hashtags": hashtags,
            "count": len(hashtags)
        }
    except Exception as e:
        logger.error(f"Trending hashtags error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending hashtags")
