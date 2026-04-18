"""
Spam protection for WebSocket messages
Rate limiting and duplicate message detection
"""

from typing import Dict, List
from datetime import datetime, timedelta
import logging
import hashlib

logger = logging.getLogger(__name__)

class SpamProtection:
    """Track and prevent spam in WebSocket communications"""
    
    def __init__(self):
        # Track message counts per user (user_id -> [(timestamp, message_hash), ...])
        self.message_history: Dict[str, List[tuple]] = {}
        
        # Rate limits (messages per minute)
        self.RATE_LIMIT_MESSAGES = 30  # 30 messages per minute
        self.RATE_LIMIT_WINDOW = 60  # 60 seconds window
        
        # Duplicate detection window (seconds)
        self.DUPLICATE_WINDOW = 5  # 5 seconds
        
        # Minimum message interval (milliseconds)
        self.MIN_MESSAGE_INTERVAL = 100  # 100ms between messages
    
    def _clean_old_messages(self, user_id: str):
        """Remove messages outside the rate limit window"""
        if user_id not in self.message_history:
            return
        
        cutoff_time = datetime.utcnow() - timedelta(seconds=self.RATE_LIMIT_WINDOW)
        self.message_history[user_id] = [
            (ts, msg_hash) for ts, msg_hash in self.message_history[user_id]
            if ts > cutoff_time
        ]
        
        # Clean up empty entries
        if not self.message_history[user_id]:
            del self.message_history[user_id]
    
    def _hash_message(self, content: str) -> str:
        """Create hash of message content"""
        return hashlib.md5(content.encode()).hexdigest()
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user has exceeded rate limit
        
        Returns:
            True if within rate limit, False if exceeded
        """
        self._clean_old_messages(user_id)
        
        if user_id not in self.message_history:
            return True
        
        message_count = len(self.message_history[user_id])
        
        if message_count >= self.RATE_LIMIT_MESSAGES:
            logger.warning(f"User {user_id} exceeded rate limit: {message_count} messages in {self.RATE_LIMIT_WINDOW}s")
            return False
        
        return True
    
    def check_duplicate(self, user_id: str, content: str) -> bool:
        """
        Check if message is a duplicate of recent message
        
        Returns:
            True if duplicate, False if unique
        """
        if not content or len(content.strip()) == 0:
            return False
        
        message_hash = self._hash_message(content)
        
        if user_id not in self.message_history:
            return False
        
        # Check for duplicates within window
        cutoff_time = datetime.utcnow() - timedelta(seconds=self.DUPLICATE_WINDOW)
        
        for ts, msg_hash in self.message_history[user_id]:
            if ts > cutoff_time and msg_hash == message_hash:
                logger.warning(f"Duplicate message detected from user {user_id}")
                return True
        
        return False
    
    def record_message(self, user_id: str, content: str):
        """Record a message for spam tracking"""
        if user_id not in self.message_history:
            self.message_history[user_id] = []
        
        message_hash = self._hash_message(content)
        self.message_history[user_id].append((datetime.utcnow(), message_hash))
        
        # Keep list size manageable
        if len(self.message_history[user_id]) > 100:
            self.message_history[user_id] = self.message_history[user_id][-50:]
    
    def validate_message_length(self, content: str, min_length: int = 1, max_length: int = 1000) -> bool:
        """
        Validate message length
        
        Returns:
            True if valid, False if invalid
        """
        if not content:
            return False
        
        content_length = len(content.strip())
        
        if content_length < min_length:
            return False
        
        if content_length > max_length:
            logger.warning(f"Message too long: {content_length} characters (max {max_length})")
            return False
        
        return True
    
    def clear_user_history(self, user_id: str):
        """Clear spam tracking history for user (on disconnect)"""
        if user_id in self.message_history:
            del self.message_history[user_id]

# Global spam protection instance
spam_protection = SpamProtection()
