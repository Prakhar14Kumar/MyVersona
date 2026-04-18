"""
VerSona WebSocket Authorization

Provides authorization for WebSocket connections and events.

Usage:
    from core.websocket import AuthorizedWebSocketHandler, require_ws_role
    
    class MyChatHandler(AuthorizedWebSocketHandler):
        @require_ws_role("user")
        async def handle_send_message(self, ws, user, data):
            ...
"""

from .auth import (
    authorize_ws_connection,
    require_ws_role,
    require_ws_permission,
    require_ws_college_access,
    AuthorizedWebSocketHandler,
    AuthorizedChatHandler,
    AuthorizedModerationHandler,
    WebSocketAuthorizationError
)

__all__ = [
    "authorize_ws_connection",
    "require_ws_role",
    "require_ws_permission",
    "require_ws_college_access",
    "AuthorizedWebSocketHandler",
    "AuthorizedChatHandler",
    "AuthorizedModerationHandler",
    "WebSocketAuthorizationError",
]
