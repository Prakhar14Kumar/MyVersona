"""
Centralized Caching Layer using Async Redis
Handles persistent connection pooling and robust fallback if Redis is offline.
"""
import redis.asyncio as redis
import json
import logging
import hashlib
from typing import Optional, Any
from .config import settings

logger = logging.getLogger(__name__)

# Initialize a global Redis connection pool
# decode_responses=True ensures we get distinct strings instead of bytes
redis_client: Optional[redis.Redis] = None

async def init_redis():
    """Initializes the Redis connection globally on app startup."""
    global redis_client
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            # Socket timeout prevents backend hanging if Redis cluster fails
            socket_timeout=2.0 
        )
        # Ping to check connection
        await redis_client.ping()
        logger.info(f"⚡ Connected to Redis Caching Layer at {settings.REDIS_URL}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Redis: {str(e)} - Caching will safely bypass.")
        redis_client = None

async def get_cache(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None

async def set_cache(key: str, data: Any, ttl_seconds: int = 3600):
    if not redis_client:
        return
    try:
        await redis_client.setex(key, ttl_seconds, json.dumps(data))
    except Exception as e:
        logger.warning(f"Failed to set cache for {key}: {str(e)}")

def generate_prompt_hash(prompt_data: dict) -> str:
    """Creates a deterministic MD5 hash of an AI request payload for caching."""
    # Ensure stable sorting before hashing
    stable_string = json.dumps(prompt_data, sort_keys=True)
    return hashlib.md5(stable_string.encode('utf-8')).hexdigest()

async def close_redis():
    """Closes Redis connection cleanly."""
    global redis_client
    if redis_client:
        await redis_client.close()
