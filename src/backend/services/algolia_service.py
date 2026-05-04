import logging
from algoliasearch.search.client import SearchClient
from src.backend.config import settings

logger = logging.getLogger(__name__)

class AlgoliaService:
    def __init__(self):
        self.app_id = settings.ALGOLIA_APP_ID
        self.admin_key = settings.ALGOLIA_ADMIN_KEY
        
        if not self.app_id or not self.admin_key:
            logger.warning("Algolia credentials not found. Search indexing will be disabled.")
            self.client = None
            return
            
        try:
            # v4 Async Client initialization
            self.client = SearchClient(self.app_id, self.admin_key)
            logger.info("Algolia service client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Algolia service client: {e}")
            self.client = None

    async def initialize_indices(self):
        """Configure Algolia index settings. Call this during app startup."""
        if not self.client: return
        
        try:
            # Configure users index settings
            await self.client.set_settings("users", {
                "searchableAttributes": ["username", "full_name", "bio", "college_name", "branch"],
                "customRanking": ["desc(is_verified)", "desc(followers_count)"]
            })
            
            # Configure posts index settings
            await self.client.set_settings("posts", {
                "searchableAttributes": ["content", "hashtags", "username", "full_name"],
                "customRanking": ["desc(likes_count)", "desc(created_at)"],
                "attributesForFaceting": ["type", "hashtags"]
            })
            
            # Configure hashtags index settings
            await self.client.set_settings("hashtags", {
                "searchableAttributes": ["tag"],
                "customRanking": ["desc(count)"]
            })
            
            logger.info("Algolia index settings configured successfully.")
        except Exception as e:
            logger.error(f"Failed to configure Algolia indices: {e}")

    async def sync_user_profile(self, user_id: str, user_data: dict):
        """Sync user profile to Algolia"""
        if not self.client: return
        
        try:
            # Prepare data
            record = {
                "objectID": user_id,
                "uid": user_id,
                "username": user_data.get("username", ""),
                "full_name": user_data.get("full_name", ""),
                "bio": user_data.get("bio", ""),
                "college_name": user_data.get("college_name", ""),
                "branch": user_data.get("branch", ""),
                "year": user_data.get("year", ""),
                "avatar_url": user_data.get("avatar_url", ""),
                "is_verified": user_data.get("is_verified", False),
                "followers_count": user_data.get("followers_count", 0),
            }
            
            # Remove empty fields
            record = {k: v for k, v in record.items() if v is not None}
            await self.client.save_object("users", record)
            logger.info(f"Successfully synced user {user_id} to Algolia")
        except Exception as e:
            logger.error(f"Error syncing user {user_id} to Algolia: {e}")

    async def delete_user(self, user_id: str):
        """Remove user profile from Algolia"""
        if not self.client: return
        
        try:
            await self.client.delete_object("users", user_id)
        except Exception as e:
            logger.error(f"Error deleting user {user_id} from Algolia: {e}")

    async def sync_post(self, post_id: str, post_data: dict):
        """Sync post to Algolia and update hashtags"""
        if not self.client: return
        
        try:
            # Sync Post
            record = {
                "objectID": post_id,
                "id": post_id,
                "user_id": post_data.get("user_id", ""),
                "username": post_data.get("username", ""),
                "full_name": post_data.get("full_name", ""),
                "user_avatar": post_data.get("user_avatar", ""),
                "content": post_data.get("content", ""),
                "type": post_data.get("type", "entertainment"),
                "hashtags": post_data.get("hashtags", []),
                "likes_count": post_data.get("likes_count", 0),
                "comments_count": post_data.get("comments_count", 0),
                "created_at": post_data.get("created_at")
            }
            
            # If created_at is datetime, convert to timestamp
            if hasattr(record["created_at"], "timestamp"):
                record["created_at"] = int(record["created_at"].timestamp())
                
            await self.client.save_object("posts", record)
            
            # Extract and Sync Hashtags
            hashtags = post_data.get("hashtags", [])
            for tag in hashtags:
                if not tag.startswith("#"):
                    tag = f"#{tag}"
                
                # Fetch existing hashtag to increment count or create new
                try:
                    existing = await self.client.get_object("hashtags", tag)
                    
                    # Handle pydantic v2 dump if it's a model
                    if hasattr(existing, 'model_dump'):
                        existing = existing.model_dump()
                    elif not isinstance(existing, dict):
                        existing = dict(existing)
                        
                    await self.client.partial_update_object("hashtags", {
                        "objectID": tag,
                        "count": existing.get("count", 0) + 1
                    })
                except Exception: # Doesn't exist or other error
                    await self.client.save_object("hashtags", {
                        "objectID": tag,
                        "tag": tag,
                        "count": 1
                    })
                    
            logger.info(f"Successfully synced post {post_id} to Algolia")
        except Exception as e:
            logger.error(f"Error syncing post {post_id} to Algolia: {e}")

    async def delete_post(self, post_id: str):
        """Remove post from Algolia"""
        if not self.client: return
        
        try:
            await self.client.delete_object("posts", post_id)
        except Exception as e:
            logger.error(f"Error deleting post {post_id} from Algolia: {e}")

    async def get_trending_hashtags(self, limit: int = 10):
        """Fetch trending hashtags (asynchronous)"""
        if not self.client: return []
        
        try:
            results = await self.client.search_single_index("hashtags", {"hitsPerPage": limit})
            
            if hasattr(results, 'hits'):
                return [h.model_dump() if hasattr(h, 'model_dump') else dict(h) for h in results.hits]
            elif isinstance(results, dict):
                return results.get("hits", [])
                
            return []
        except Exception as e:
            logger.error(f"Error fetching trending hashtags: {e}")
            return []

algolia_service = AlgoliaService()
