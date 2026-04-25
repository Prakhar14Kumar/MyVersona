from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Literal
import logging
from datetime import datetime, timedelta
from firebase_admin import firestore

from core.auth.decorators import get_current_user
from services.firebase_service import db
from core.dependencies import get_current_user_id as auth_get_current_user_id


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/explore", tags=["explore"])

@router.get("/trending")
async def get_trending(
    category: Literal["people", "colleges", "posts"] = Query(..., description="Trending category"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get trending content by category
    
    **Categories:**
    - **people**: Top users by followers count
    - **colleges**: Top colleges by members count
    - **posts**: Recent posts sorted by engagement (likes + comments)
    
    **Returns:**
    - Simple engagement-based trending (no ML)
    - Last 24 hours for posts
    - Limit 10 results
    """
    try:
        if category == "posts":
            data = await _get_trending_posts()
        elif category == "people":
            data = await _get_trending_people()
        elif category == "colleges":
            data = await _get_trending_colleges()
        else:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        return {
            "success": True,
            "data": data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get trending error [{category}]: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trending {category}"
        )


async def _get_trending_posts() -> list:
    """
    Get trending posts from last 24 hours
    Sorted by engagement (likes + comments)
    """
    try:
        # Calculate 24 hours ago
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        # Query posts from last 24 hours
        posts_ref = db.collection("posts")
        query = posts_ref.where("createdAt", ">=", twenty_four_hours_ago).stream()
        
        # Collect posts with engagement score
        posts_with_engagement = []
        for doc in query:
            post_data = doc.to_dict()
            
            # Calculate engagement score
            likes = post_data.get("likes", 0)
            comments = post_data.get("comments", 0)
            engagement_score = likes + comments
            
            # Add to list with engagement score
            posts_with_engagement.append({
                "id": doc.id,
                "userId": post_data.get("userId"),
                "userName": post_data.get("userName"),
                "userAvatar": post_data.get("userAvatar", ""),
                "userCollege": post_data.get("userCollege"),
                "content": post_data.get("content", ""),
                "image": post_data.get("image"),
                "type": post_data.get("type"),
                "likes": likes,
                "comments": comments,
                "engagement_score": engagement_score,
                "createdAt": post_data.get("createdAt").isoformat() if post_data.get("createdAt") else None,
            })
        
        # Sort by engagement score (descending)
        posts_with_engagement.sort(key=lambda x: x["engagement_score"], reverse=True)
        
        # Return top 10, remove engagement_score from response
        trending_posts = []
        for post in posts_with_engagement[:10]:
            post.pop("engagement_score", None)
            trending_posts.append(post)
        
        logger.info(f"Trending posts fetched: {len(trending_posts)} posts")
        return trending_posts
    
    except Exception as e:
        logger.error(f"Get trending posts error: {e}", exc_info=True)
        raise


async def _get_trending_people() -> list:
    """
    Get trending people sorted by followers count
    """
    try:
        # Query users ordered by followers
        users_ref = db.collection("users")
        query = users_ref.order_by("followers", direction=firestore.Query.DESCENDING).limit(10).stream()
        
        trending_people = []
        for doc in query:
            user_data = doc.to_dict()
            
            # Return safe user data (no sensitive info)
            trending_people.append({
                "uid": doc.id,
                "displayName": user_data.get("displayName", "Unknown User"),
                "photoURL": user_data.get("photoURL", ""),
                "bio": user_data.get("bio", ""),
                "college": user_data.get("college"),
                "role": user_data.get("role", "student"),
                "followersCount": user_data.get("followers", 0),
                "postsCount": user_data.get("posts", 0),
            })
        
        logger.info(f"Trending people fetched: {len(trending_people)} users")
        return trending_people
    
    except Exception as e:
        logger.error(f"Get trending people error: {e}", exc_info=True)
        raise


async def _get_trending_colleges() -> list:
    """
    Get trending colleges sorted by members count
    """
    try:
        # Query colleges ordered by members
        colleges_ref = db.collection("colleges")
        query = colleges_ref.order_by("members", direction=firestore.Query.DESCENDING).limit(10).stream()
        
        trending_colleges = []
        for doc in query:
            college_data = doc.to_dict()
            
            trending_colleges.append({
                "id": doc.id,
                "name": college_data.get("name"),
                "hashtag": college_data.get("hashtag"),
                "banner": college_data.get("banner", ""),
                "membersCount": college_data.get("members", 0),
                "postsCount": college_data.get("posts", 0),
                "verified": college_data.get("verified", False),
                "location": college_data.get("location", ""),
            })
        
        logger.info(f"Trending colleges fetched: {len(trending_colleges)} colleges")
        return trending_colleges
    
    except Exception as e:
        logger.error(f"Get trending colleges error: {e}", exc_info=True)
        raise
