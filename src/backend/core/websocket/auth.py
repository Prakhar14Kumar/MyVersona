"""
WebSocket authorization for VerSona
Provides permission checking for WebSocket events
"""

from functools import wraps
from typing import Callable, List
from fastapi import WebSocket, WebSocketDisconnect
from firebase_admin import auth as firebase_auth
import logging
import json

from src.backend.core.auth.roles import (
    has_role,
    has_permission,
    has_any_role,
    can_moderate_college
)

from src.backend.core.auth.cache import (
    get_cached_user_permissions,
    cache_user_permissions
)

logger = logging.getLogger(__name__)

class WebSocketAuthorizationError(Exception):
    """Exception raised when WebSocket authorization fails"""
    pass

async def authorize_ws_connection(token: str) -> dict:
    """
    Authorize WebSocket connection and return user data
    
    Args:
        token: Firebase Auth token from client
        
    Returns:
        User dict with role and permissions
        
    Raises:
        WebSocketAuthorizationError: If authorization fails
    """
    try:
        # Verify Firebase token
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token["uid"]
        
        # Check cache first
        cached_user = get_cached_user_permissions(user_id)
        if cached_user:
            logger.debug(f"WebSocket auth: Using cached data for user {user_id}")
            return cached_user
        
        # Get user from custom claims first (faster)
        user_data = {
            "uid": user_id,
            "email": decoded_token.get("email"),
            "role": decoded_token.get("role", "user"),
            "permissions": decoded_token.get("permissions", []),
            "assigned_colleges": decoded_token.get("assigned_colleges", [])
        }
        
        # Cache for future requests
        cache_user_permissions(user_id, user_data)
        
        logger.info(f"WebSocket connection authorized for user {user_id}")
        return user_data
        
    except firebase_auth.InvalidIdTokenError:
        logger.error("Invalid Firebase token for WebSocket connection")
        raise WebSocketAuthorizationError("Invalid authentication token")
    except Exception as e:
        logger.error(f"WebSocket authorization error: {e}")
        raise WebSocketAuthorizationError("Authorization failed")

def require_ws_role(*required_roles: str):
    """
    Decorator to require specific role(s) for WebSocket event handlers
    
    Usage:
        @require_ws_role("admin", "college_moderator")
        async def handle_moderation_event(ws, user, data):
            ...
    
    Args:
        required_roles: One or more role strings
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(self, ws: WebSocket, user: dict, data: dict, *args, **kwargs):
            # Check if user has any of the required roles
            if not has_any_role(user, list(required_roles)):
                logger.warning(
                    f"User {user.get('uid')} attempted WS event {func.__name__} "
                    f"without required roles: {required_roles}"
                )
                
                # Send error to client
                await ws.send_json({
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": f"Requires one of: {', '.join(required_roles)}"
                })
                return
            
            # Execute handler
            return await func(self, ws, user, data, *args, **kwargs)
        
        return wrapper
    return decorator

def require_ws_permission(required_permission: str):
    """
    Decorator to require specific permission for WebSocket event handlers
    
    Usage:
        @require_ws_permission("chat.send")
        async def handle_send_message(ws, user, data):
            ...
    
    Args:
        required_permission: Permission string
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(self, ws: WebSocket, user: dict, data: dict, *args, **kwargs):
            # Check permission
            if not has_permission(user, required_permission):
                logger.warning(
                    f"User {user.get('uid')} attempted WS event {func.__name__} "
                    f"without permission: {required_permission}"
                )
                
                # Send error to client
                await ws.send_json({
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": f"Missing permission: {required_permission}"
                })
                return
            
            # Execute handler
            return await func(self, ws, user, data, *args, **kwargs)
        
        return wrapper
    return decorator

def require_ws_college_access(college_id_field: str = "college_id"):
    """
    Decorator to check college access for WebSocket events
    
    Usage:
        @require_ws_college_access("college_id")
        async def handle_college_event(ws, user, data):
            # data must contain college_id field
            ...
    
    Args:
        college_id_field: Field name in data dict containing college ID
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(self, ws: WebSocket, user: dict, data: dict, *args, **kwargs):
            college_id = data.get(college_id_field)
            
            if not college_id:
                await ws.send_json({
                    "type": "error",
                    "code": "BAD_REQUEST",
                    "message": f"Missing {college_id_field}"
                })
                return
            
            # Check college access
            if not can_moderate_college(user, college_id):
                logger.warning(
                    f"User {user.get('uid')} attempted to access college {college_id} "
                    f"via WebSocket without authorization"
                )
                
                await ws.send_json({
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": f"Not authorized for college {college_id}"
                })
                return
            
            # Execute handler
            return await func(self, ws, user, data, *args, **kwargs)
        
        return wrapper
    return decorator

class AuthorizedWebSocketHandler:
    """
    Base class for WebSocket handlers with built-in authorization
    """
    
    def __init__(self):
        self.connections: dict = {}  # {user_id: websocket}
        self.user_data: dict = {}    # {user_id: user_data}
    
    async def connect(self, websocket: WebSocket, token: str):
        """
        Handle WebSocket connection with authorization
        
        Args:
            websocket: WebSocket connection
            token: Firebase Auth token
        """
        try:
            # Authorize connection
            user = await authorize_ws_connection(token)
            
            # Check if user has base permission
            if not self._check_connection_permission(user):
                await websocket.close(code=1008, reason="Insufficient permissions")
                return
            
            # Accept connection
            await websocket.accept()
            
            # Store connection
            user_id = user["uid"]
            self.connections[user_id] = websocket
            self.user_data[user_id] = user
            
            logger.info(f"WebSocket connected: User {user_id}")
            
            # Send welcome message
            await websocket.send_json({
                "type": "connected",
                "user_id": user_id,
                "role": user.get("role")
            })
            
            # Call custom connection handler
            await self.on_connect(websocket, user)
            
            # Listen for messages
            await self.listen(websocket, user)
            
        except WebSocketAuthorizationError as e:
            logger.error(f"WebSocket authorization failed: {e}")
            await websocket.close(code=1008, reason=str(e))
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected during connection")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            await websocket.close(code=1011, reason="Internal server error")
    
    def _check_connection_permission(self, user: dict) -> bool:
        """
        Override this method to check connection permissions
        
        Args:
            user: User dict
            
        Returns:
            True if user can connect
        """
        return True  # Default: allow all authenticated users
    
    async def on_connect(self, websocket: WebSocket, user: dict):
        """
        Called after successful connection
        Override in subclass for custom logic
        """
        pass
    
    async def listen(self, websocket: WebSocket, user: dict):
        """
        Listen for messages from client
        
        Args:
            websocket: WebSocket connection
            user: User data
        """
        try:
            while True:
                # Receive message
                data = await websocket.receive_json()
                
                # Get event type
                event_type = data.get("type")
                
                if not event_type:
                    await websocket.send_json({
                        "type": "error",
                        "code": "BAD_REQUEST",
                        "message": "Missing event type"
                    })
                    continue
                
                # Route to handler
                await self.handle_event(websocket, user, event_type, data)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: User {user.get('uid')}")
            await self.disconnect(user["uid"])
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await self.disconnect(user["uid"])
    
    async def handle_event(self, websocket: WebSocket, user: dict, event_type: str, data: dict):
        """
        Route event to appropriate handler
        Override in subclass
        
        Args:
            websocket: WebSocket connection
            user: User data
            event_type: Type of event
            data: Event data
        """
        await websocket.send_json({
            "type": "error",
            "code": "NOT_IMPLEMENTED",
            "message": f"Event {event_type} not handled"
        })
    
    async def disconnect(self, user_id: str):
        """
        Handle disconnection
        
        Args:
            user_id: User ID
        """
        if user_id in self.connections:
            del self.connections[user_id]
        
        if user_id in self.user_data:
            del self.user_data[user_id]
        
        logger.info(f"WebSocket disconnected: User {user_id}")
    
    async def send_to_user(self, user_id: str, message: dict):
        """
        Send message to specific user
        
        Args:
            user_id: Target user ID
            message: Message to send
        """
        if user_id in self.connections:
            try:
                await self.connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to user {user_id}: {e}")
                await self.disconnect(user_id)
    
    async def broadcast(self, message: dict, exclude: List[str] = None):
        """
        Broadcast message to all connected users
        
        Args:
            message: Message to broadcast
            exclude: List of user IDs to exclude
        """
        exclude = exclude or []
        
        for user_id, ws in list(self.connections.items()):
            if user_id not in exclude:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    await self.disconnect(user_id)
    
    async def broadcast_to_role(self, role: str, message: dict):
        """
        Broadcast message to users with specific role
        
        Args:
            role: Target role
            message: Message to send
        """
        for user_id, user in self.user_data.items():
            if has_role(user, role):
                await self.send_to_user(user_id, message)

# Example: Chat WebSocket Handler with Authorization
class AuthorizedChatHandler(AuthorizedWebSocketHandler):
    """Chat handler with authorization"""
    
    def _check_connection_permission(self, user: dict) -> bool:
        """Only authenticated users can connect to chat"""
        return has_permission(user, "messages.send")
    
    async def handle_event(self, websocket: WebSocket, user: dict, event_type: str, data: dict):
        """Handle chat events"""
        handlers = {
            "send_message": self.handle_send_message,
            "delete_message": self.handle_delete_message,
            "typing": self.handle_typing
        }
        
        handler = handlers.get(event_type)
        if handler:
            await handler(websocket, user, data)
        else:
            await websocket.send_json({
                "type": "error",
                "code": "UNKNOWN_EVENT",
                "message": f"Unknown event type: {event_type}"
            })
    
    @require_ws_permission("messages.send")
    async def handle_send_message(self, ws: WebSocket, user: dict, data: dict):
        """Handle send message event"""
        # Implementation here
        pass
    
    @require_ws_permission("chat.delete_any")
    async def handle_delete_message(self, ws: WebSocket, user: dict, data: dict):
        """Handle delete message event (moderator/admin only)"""
        # Implementation here
        pass
    
    async def handle_typing(self, ws: WebSocket, user: dict, data: dict):
        """Handle typing indicator (no special permission needed)"""
        # Implementation here
        pass

# Example: Moderation WebSocket Handler
class AuthorizedModerationHandler(AuthorizedWebSocketHandler):
    """Moderation handler with authorization"""
    
    def _check_connection_permission(self, user: dict) -> bool:
        """Only moderators and admins can connect"""
        return has_any_role(user, ["admin", "college_moderator"])
    
    @require_ws_role("admin", "college_moderator")
    @require_ws_college_access("college_id")
    async def handle_ban_user(self, ws: WebSocket, user: dict, data: dict):
        """Handle user ban (with college scope check)"""
        # Implementation here
        pass
