from fastapi import APIRouter, HTTPException, Header, Query, Depends
from typing import Optional, List, Literal
import logging

from ..models.post import Post, PostCreate, PostUpdate, Comment, CommentCreate, CommentsResponse
from ..services.firebase_service import FirebaseService
from ..services.auth_service import AuthService
from ..services.ai_service import ai_service
from ..websocket.notification_handler import notification_handler
from ..core.dependencies import get_current_user_id as auth_get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/posts", tags=["Posts"])



# ==================== POST CREATION ====================

@router.post("/", response_model=Post)
async def create_post(
    post_data: PostCreate,
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Create a new post
    
    - Content: 1-2000 characters (validated & sanitized)
    - Feed type: entertainment or career
    - Returns: Complete post object
    """
    try:
        
        # Get user profile
        user = await FirebaseService.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "User not found"}
            )
        
        # Create post document
        post_doc = {
            "user_id": user_id,
            "username": user["username"],
            "user_avatar": user.get("avatar_url"),
            "full_name": user["full_name"],
            "content": post_data.content,  # Already sanitized by Pydantic validator
            "feed_type": post_data.feed_type,
            "media_urls": post_data.media_urls,
            "media_type": post_data.media_type,
            "hashtags": post_data.hashtags,
            "poll_options": post_data.poll_options,
            "event_details": post_data.event_details,
            "is_verified_user": user.get("is_verified", False),
        }
        
        # Create post with transaction
        post = await FirebaseService.create_post(post_doc)
        
        logger.info(f"Post created successfully: {post['post_id']}")
        return post
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to create post"}
        )

# ==================== FEED ====================

@router.get("/feed/{feed_type}", response_model=List[Post])
async def get_feed(
    feed_type: Literal["entertainment", "career"],
    limit: int = Query(20, ge=1, le=50),
    last_post_id: Optional[str] = None,
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Get posts for a specific feed with cursor pagination
    
    - Feed type: entertainment or career
    - Limit: 1-50 posts (default 20)
    - Cursor: last_post_id for pagination
    """
    try:
        
        posts = await FirebaseService.get_feed_posts(feed_type, limit, last_post_id)
        return posts
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get feed error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to fetch feed"}
        )

# ==================== SINGLE POST ====================

@router.get("/{post_id}", response_model=Post)
async def get_post(
    post_id: str,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Get a specific post by ID"""
    try:
        
        post = await FirebaseService.get_post(post_id)
        if not post:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Post not found"}
            )
        
        return post
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to fetch post"}
        )

# ==================== LIKE / UNLIKE ====================

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Like a post
    
    - Atomic operation (transaction)
    - Prevents duplicate likes
    - Increments likes_count
    """
    try:
        
        # Verify post exists and like it
        success = await FirebaseService.like_post(post_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "Post already liked or not found"}
            )
        
        return {"success": True, "message": "Post liked successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Like post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to like post"}
        )

@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: str,
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Unlike a post
    
    - Atomic operation (transaction)
    - Only works if already liked
    - Decrements likes_count
    """
    try:
        
        # Verify post exists and unlike it
        success = await FirebaseService.unlike_post(post_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "Post not liked or not found"}
            )
        
        return {"success": True, "message": "Post unliked successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unlike post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to unlike post"}
        )

# ==================== COMMENTS ====================

@router.post("/{post_id}/comments", response_model=Comment)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Create a comment on a post
    
    - Content: 1-500 characters (validated & sanitized)
    - Atomic operation (transaction)
    - Increments comments_count
    """
    try:
        
        # Get user profile
        user = await FirebaseService.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "User not found"}
            )
        
        # Create comment document
        comment_doc = {
            "user_id": user_id,
            "username": user["username"],
            "user_avatar": user.get("avatar_url"),
            "full_name": user["full_name"],
            "content": comment_data.content,  # Already sanitized by Pydantic validator
        }
        
        # Create comment with transaction
        comment = await FirebaseService.create_comment(post_id, comment_doc)
        
        if not comment:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Post not found"}
            )
        
        logger.info(f"Comment created successfully: {comment['comment_id']} on post {post_id}")
        return comment
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create comment error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to create comment"}
        )

@router.get("/{post_id}/comments", response_model=CommentsResponse)
async def get_comments(
    post_id: str,
    limit: int = Query(20, ge=1, le=100, description="Number of comments to fetch"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (comment_id)"),
    user_id: str = Depends(auth_get_current_user_id)
):
    """
    Get comments for a post with cursor pagination
    
    - Limit: 1-100 comments (default 20)
    - Cursor: last comment_id for pagination
    - Ordered by created_at ASC (oldest first)
    - Returns: comments list + next_cursor + has_more flag
    """
    try:
        
        # Get comments with cursor pagination
        comments, next_cursor = await FirebaseService.get_comments(post_id, limit, cursor)
        
        return {
            "comments": comments,
            "next_cursor": next_cursor,
            "has_more": next_cursor is not None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get comments error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to fetch comments"}
        )

# ==================== POST UPDATE / DELETE ====================

@router.put("/{post_id}", response_model=Post)
async def update_post(
    post_id: str,
    updates: PostUpdate,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Update a post (content and hashtags only)"""
    try:
        
        post = await FirebaseService.get_post(post_id)
        if not post:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Post not found"}
            )
        
        if post["user_id"] != user_id:
            raise HTTPException(
                status_code=403,
                detail={"success": False, "error": "Not authorized to update this post"}
            )
        
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        if not update_data:
            return post
        
        updated_post = await FirebaseService.update_post(post_id, update_data)
        
        logger.info(f"Post updated successfully: {post_id}")
        return updated_post
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to update post"}
        )

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Delete a post (owner only)"""
    try:
        
        success = await FirebaseService.delete_post(post_id, user_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Post not found or not authorized"}
            )
        
        logger.info(f"Post deleted successfully: {post_id}")
        return {"success": True, "message": "Post deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete post error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Failed to delete post"}
        )