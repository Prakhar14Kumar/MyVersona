"""
Background Feed Generator Service
Offloads the heavy computation needed to rank/sort posts based on user interests.
"""
import logging
import asyncio
from core.cache import set_cache

logger = logging.getLogger(__name__)

async def compute_and_cache_feed(user_uid: str, interests: list[str], college: str):
    """
    Heavy task to be executed exactly once per session or periodically.
    It identifies all posts relevant to the user, ranks them, and stores the list
    of post IDs in Redis.
    """
    logger.info(f"🚀 [BACKGROUND] Starting feed computation for user {user_uid}...")
    
    try:
        # Simulate heavy database work (e.g. searching Firestore, ranking scores)
        await asyncio.sleep(3) 
        
        # E.g. We queried and found these 50 best post IDs
        recommended_post_ids = [
            f"post_{college}_101", 
            f"post_{interests[0] if interests else 'trend'}_202",
            "post_global_001"
        ]
        
        # Cache Result in Redis (user:UID:feed)
        # We hold the feed for 15 minutes before the background task needs to run again.
        cache_key = f"user:{user_uid}:feed"
        await set_cache(cache_key, recommended_post_ids, ttl_seconds=900)
        
        logger.info(f"✅ [BACKGROUND] Feed computed and stored in Redis for {user_uid}. (Items: {len(recommended_post_ids)})")
    
    except Exception as e:
        logger.error(f"❌ [BACKGROUND] Failed to compute feed for {user_uid}: {str(e)}")
