"""
Simple in-memory cache for demo scale (≤100 users)
For production, use Redis
"""
from datetime import datetime, timedelta
from typing import Optional, Any, Dict, Tuple
from functools import wraps
import asyncio

# Simple in-memory cache storage
_cache: Dict[str, Tuple[Any, datetime]] = {}
_cache_lock = asyncio.Lock()

async def cache_get(key: str) -> Optional[Any]:
    """
    Get value from cache if not expired
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if not found/expired
    """
    async with _cache_lock:
        if key in _cache:
            value, expiry = _cache[key]
            if datetime.now() < expiry:
                return value
            else:
                # Remove expired entry
                del _cache[key]
        return None

async def cache_set(key: str, value: Any, ttl_seconds: int = 300):
    """
    Set value in cache with TTL
    
    Args:
        key: Cache key
        value: Value to cache
        ttl_seconds: Time to live in seconds (default: 5 minutes)
    """
    async with _cache_lock:
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        _cache[key] = (value, expiry)

async def cache_delete(key: str):
    """
    Remove value from cache
    
    Args:
        key: Cache key
    """
    async with _cache_lock:
        if key in _cache:
            del _cache[key]

async def cache_delete_pattern(pattern: str):
    """
    Remove all keys matching pattern
    
    Args:
        pattern: Key pattern to match (simple string matching)
    """
    async with _cache_lock:
        keys_to_delete = [k for k in _cache.keys() if pattern in k]
        for key in keys_to_delete:
            del _cache[key]

async def cache_clear():
    """Clear entire cache"""
    async with _cache_lock:
        _cache.clear()

def cached(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results
    
    Args:
        ttl_seconds: Time to live in seconds
        key_prefix: Prefix for cache key
        
    Usage:
        @cached(ttl_seconds=600, key_prefix="user")
        async def get_user(user_id: str):
            # ... expensive operation
            return user_data
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and args
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = await cache_get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache_set(cache_key, result, ttl_seconds)
            
            return result
        return wrapper
    return decorator

# Cache statistics (useful for monitoring)
def get_cache_stats() -> dict:
    """Get cache statistics"""
    now = datetime.now()
    total_keys = len(_cache)
    expired_keys = sum(1 for _, expiry in _cache.values() if expiry < now)
    
    return {
        "total_keys": total_keys,
        "active_keys": total_keys - expired_keys,
        "expired_keys": expired_keys
    }
