from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging

from dependencies.auth_dependency import get_current_user
from services.feed_service import compute_and_cache_feed
from core.cache import get_cache

router = APIRouter(
    prefix="/api/feed",
    tags=["Smart Feed System"],
    dependencies=[Depends(get_current_user)]
)

logger = logging.getLogger(__name__)

class FeedGenerateRequest(BaseModel):
    interests: List[str]
    college: str

@router.post("/generate", status_code=202)
async def dispatch_feed_generation(
    request: FeedGenerateRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    DISPATCHER: Immediately returns 202 Accepted.
    Hands off the heavy feed ranking algorithm to a non-blocking background worker.
    """
    user_id = user.get("uid")
    
    # 1. Dispatch the task globally, off the main HTTP thread
    background_tasks.add_task(
        compute_and_cache_feed, 
        user_uid=user_id, 
        interests=request.interests, 
        college=request.college
    )
    
    return {
        "success": True, 
        "message": "Feed generation queued successfully. It will be available in cache shortly."
    }

@router.get("/fetch")
async def fetch_feed(user: dict = Depends(get_current_user)):
    """
    The Frontend hits this infinitely to get their feed.
    Pulls exclusively from the ultra-fast Redis Cache.
    """
    user_id = user.get("uid")
    cache_key = f"user:{user_id}:feed"
    
    cached_feed_ids = await get_cache(cache_key)
    
    if not cached_feed_ids:
        # If cache expired or hasn't generated yet, explicitly tell frontend to wait
        # or we could dispatch a generation event here automatically.
        return {"success": True, "data": [], "status": "generating"}
        
    return {
        "success": True, 
        "data": cached_feed_ids, 
        "status": "ready"
    }
