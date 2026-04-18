"""
Permission caching for VerSona authorization system
Reduces database queries and improves performance
"""

from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

class PermissionCache:
    """
    LRU cache for user permissions with TTL
    Stores user role and permissions to avoid repeated DB queries
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        """
        Initialize permission cache
        
        Args:
            max_size: Maximum number of entries in cache
            ttl_seconds: Time-to-live for cache entries (default 5 minutes)
        """
        self.cache: OrderedDict = OrderedDict()
        self.max_size = max_size
        self.ttl = timedelta(seconds=ttl_seconds)
        self.hits = 0
        self.misses = 0
    
    def get(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached user permissions
        
        Args:
            user_id: User ID to look up
            
        Returns:
            Cached user data or None if not found/expired
        """
        if user_id not in self.cache:
            self.misses += 1
            logger.debug(f"Cache miss for user {user_id}")
            return None
        
        cached_data, timestamp = self.cache[user_id]
        
        # Check if expired
        if datetime.utcnow() - timestamp > self.ttl:
            self.invalidate(user_id)
            self.misses += 1
            logger.debug(f"Cache expired for user {user_id}")
            return None
        
        # Move to end (LRU)
        self.cache.move_to_end(user_id)
        self.hits += 1
        logger.debug(f"Cache hit for user {user_id}")
        
        return cached_data
    
    def set(self, user_id: str, user_data: Dict[str, Any]) -> None:
        """
        Cache user permissions
        
        Args:
            user_id: User ID
            user_data: User data to cache (role, permissions, etc.)
        """
        # If cache is full, remove oldest entry
        if len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            logger.debug(f"Cache full, removed oldest entry: {oldest_key}")
        
        self.cache[user_id] = (user_data, datetime.utcnow())
        logger.debug(f"Cached permissions for user {user_id}")
    
    def invalidate(self, user_id: str) -> None:
        """
        Invalidate cached permissions for a user
        
        Args:
            user_id: User ID to invalidate
        """
        if user_id in self.cache:
            del self.cache[user_id]
            logger.info(f"Invalidated cache for user {user_id}")
    
    def clear(self) -> None:
        """Clear entire cache"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Cleared entire permission cache")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dict with cache stats
        """
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "ttl_seconds": self.ttl.total_seconds()
        }

# Global cache instance
permission_cache = PermissionCache(max_size=1000, ttl_seconds=300)

# Token claims cache (for Firebase custom claims)
class TokenClaimsCache:
    """
    Cache for Firebase Auth custom claims
    These are embedded in JWT tokens, so we can cache them safely
    """
    
    def __init__(self, ttl_seconds: int = 3600):  # 1 hour
        """
        Initialize token claims cache
        
        Args:
            ttl_seconds: TTL for cached claims (default 1 hour)
        """
        self.cache: Dict[str, tuple] = {}
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def get(self, token_hash: str) -> Optional[Dict[str, Any]]:
        """
        Get cached token claims
        
        Args:
            token_hash: Hash of the token
            
        Returns:
            Cached claims or None
        """
        if token_hash not in self.cache:
            return None
        
        claims, timestamp = self.cache[token_hash]
        
        # Check expiry
        if datetime.utcnow() - timestamp > self.ttl:
            del self.cache[token_hash]
            return None
        
        return claims
    
    def set(self, token_hash: str, claims: Dict[str, Any]) -> None:
        """
        Cache token claims
        
        Args:
            token_hash: Hash of the token
            claims: Claims to cache
        """
        self.cache[token_hash] = (claims, datetime.utcnow())
    
    def invalidate(self, token_hash: str) -> None:
        """Invalidate cached claims"""
        if token_hash in self.cache:
            del self.cache[token_hash]
    
    def clear(self) -> None:
        """Clear all cached claims"""
        self.cache.clear()

# Global token cache
token_claims_cache = TokenClaimsCache(ttl_seconds=3600)

def cache_user_permissions(user_id: str, user_data: Dict[str, Any]) -> None:
    """
    Helper function to cache user permissions
    
    Args:
        user_id: User ID
        user_data: User data including role and permissions
    """
    permission_cache.set(user_id, user_data)

def get_cached_user_permissions(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Helper function to get cached user permissions
    
    Args:
        user_id: User ID
        
    Returns:
        Cached user data or None
    """
    return permission_cache.get(user_id)

def invalidate_user_permissions(user_id: str) -> None:
    """
    Helper function to invalidate user permissions cache
    Call this when user role changes
    
    Args:
        user_id: User ID
    """
    permission_cache.invalidate(user_id)
    logger.info(f"Invalidated permissions cache for user {user_id}")

def get_cache_stats() -> Dict[str, Any]:
    """
    Get statistics for all caches
    
    Returns:
        Dict with cache statistics
    """
    return {
        "permission_cache": permission_cache.get_stats(),
        "token_cache_size": len(token_claims_cache.cache)
    }

# Batch cache operations
def cache_users_batch(users: Dict[str, Dict[str, Any]]) -> None:
    """
    Cache multiple users at once
    
    Args:
        users: Dict mapping user_id to user_data
    """
    for user_id, user_data in users.items():
        permission_cache.set(user_id, user_data)
    
    logger.info(f"Cached {len(users)} users in batch")

def invalidate_users_batch(user_ids: list) -> None:
    """
    Invalidate cache for multiple users
    
    Args:
        user_ids: List of user IDs to invalidate
    """
    for user_id in user_ids:
        permission_cache.invalidate(user_id)
    
    logger.info(f"Invalidated cache for {len(user_ids)} users")

# Cache warming (preload common users)
async def warm_cache(firestore_client, common_user_ids: list = None):
    """
    Warm cache with commonly accessed users
    
    Args:
        firestore_client: Firestore client instance
        common_user_ids: List of user IDs to preload (optional)
    """
    if not common_user_ids:
        # Get most active users from last hour
        # This is a placeholder - implement based on your analytics
        logger.info("No user IDs provided for cache warming")
        return
    
    logger.info(f"Warming cache with {len(common_user_ids)} users")
    
    # Batch get users from Firestore
    users_ref = firestore_client.collection("users")
    users_data = {}
    
    for user_id in common_user_ids:
        try:
            user_doc = users_ref.document(user_id).get()
            if user_doc.exists:
                users_data[user_id] = user_doc.to_dict()
        except Exception as e:
            logger.error(f"Error warming cache for user {user_id}: {e}")
    
    # Cache all at once
    cache_users_batch(users_data)
    
    logger.info(f"Cache warmed with {len(users_data)} users")
