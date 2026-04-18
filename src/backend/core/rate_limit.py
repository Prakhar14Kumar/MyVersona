from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
from typing import Dict, Tuple

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Production-grade rate limiting middleware
    Uses in-memory storage (for production, use Redis)
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {ip_address: {endpoint: [(timestamp, count)]}}
        self.requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
        self.cleanup_task = None
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get endpoint path
        path = request.url.path
        
        # Define rate limits per endpoint
        rate_limits = self._get_rate_limit(path)
        
        if rate_limits:
            limit, window = rate_limits
            
            # Check rate limit
            if not self._check_rate_limit(client_ip, path, limit, window):
                raise HTTPException(
                    status_code=429,
                    detail={
                        "success": False,
                        "error": "Rate limit exceeded. Please try again later."
                    }
                )
        
        # Process request
        response = await call_next(request)
        
        # Start cleanup task if not running
        if self.cleanup_task is None or self.cleanup_task.done():
            self.cleanup_task = asyncio.create_task(self._cleanup_old_entries())
        
        return response
    
    def _get_rate_limit(self, path: str) -> Tuple[int, int] | None:
        """
        Get rate limit for endpoint
        Returns: (max_requests, window_seconds) or None
        """
        # Auth endpoints - stricter limits to prevent brute force
        if "/auth/login" in path or "/auth/signin" in path:
            return (5, 60)  # 5 login attempts per minute
        
        if "/auth/signup" in path or "/auth/register" in path:
            return (3, 60)  # 3 signups per minute (prevent spam accounts)
        
        if "/auth/" in path:
            return (10, 60)  # Other auth endpoints
        
        # Post creation - prevent spam
        if path.endswith("/posts") or path.endswith("/posts/"):
            if "POST" in path:
                return (10, 60)  # 10 posts per minute
        
        # Like/comment/unlike - higher limit for interactions
        if "/like" in path or "/unlike" in path:
            return (30, 60)  # 30 likes per minute
        
        if "/comments" in path or "/comment" in path:
            return (20, 60)  # 20 comments per minute
        
        # Chat/messages - moderate limit
        if "/messages" in path or "/chat" in path:
            return (30, 60)  # 30 messages per minute
        
        # File uploads - very strict
        if "/upload" in path:
            return (5, 60)  # 5 uploads per minute
        
        # AI endpoints - strict to control costs
        if "/ai/" in path or "/analyze" in path or "/recommend" in path:
            return (10, 60)  # 10 AI requests per minute
        
        # Default - 100 requests per minute
        return (100, 60)
    
    def _check_rate_limit(self, client_ip: str, endpoint: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window)
        
        # Get requests for this IP and endpoint
        requests = self.requests[client_ip][endpoint]
        
        # Remove old requests
        self.requests[client_ip][endpoint] = [
            req_time for req_time in requests if req_time > cutoff
        ]
        
        # Check limit
        if len(self.requests[client_ip][endpoint]) >= limit:
            return False
        
        # Add current request
        self.requests[client_ip][endpoint].append(now)
        return True
    
    async def _cleanup_old_entries(self):
        """Cleanup old entries every 5 minutes"""
        await asyncio.sleep(300)  # 5 minutes
        
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=10)
        
        # Cleanup old entries
        for ip in list(self.requests.keys()):
            for endpoint in list(self.requests[ip].keys()):
                self.requests[ip][endpoint] = [
                    req_time for req_time in self.requests[ip][endpoint]
                    if req_time > cutoff
                ]
                
                # Remove empty endpoint entries
                if not self.requests[ip][endpoint]:
                    del self.requests[ip][endpoint]
            
            # Remove empty IP entries
            if not self.requests[ip]:
                del self.requests[ip]