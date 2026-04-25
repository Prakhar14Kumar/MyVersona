"""
Authorization decorators for FastAPI routes
Provides role and permission checking for API endpoints
"""

from functools import wraps
from typing import List, Callable, Optional
from fastapi import HTTPException, status, Depends, Header
from .roles import has_role, has_permission, has_any_role, has_all_permissions, can_moderate_college
from .cache import permission_cache
from services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

# ==================== AUTHENTICATION DEPENDENCIES ====================

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency to get current authenticated user
    
    Usage:
        @router.get("/profile")
        async def get_profile(current_user: dict = Depends(get_current_user)):
            ...
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        user = await AuthService.get_current_user(token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    FastAPI dependency to get current user (optional - returns None if not authenticated)
    
    Usage:
        @router.get("/public-feed")
        async def get_feed(current_user: Optional[dict] = Depends(get_current_user_optional)):
            # current_user may be None
            ...
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        user = await AuthService.get_current_user(token)
        return user
    except Exception:
        return None

# ==================== ROLE/PERMISSION DECORATORS ====================

def require_role(required_role: str):
    """
    Decorator to require a specific role or higher
    
    Usage:
        @router.get("/admin/users")
        @require_role("admin")
        async def get_users(current_user = Depends(get_current_user)):
            ...
    
    Args:
        required_role: Role string (e.g., "admin", "creator")
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs (injected by FastAPI)
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check role
            if not has_role(current_user, required_role):
                logger.warning(
                    f"User {current_user.get('uid')} attempted to access {func.__name__} "
                    f"without required role: {required_role}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires {required_role} role"
                )
            
            # Call original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def require_permission(required_permission: str):
    """
    Decorator to require a specific permission
    
    Usage:
        @router.delete("/posts/{post_id}")
        @require_permission("posts.delete_any")
        async def delete_post(post_id: str, current_user = Depends(get_current_user)):
            ...
    
    Args:
        required_permission: Permission string (e.g., "posts.delete_any")
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check permission
            if not has_permission(current_user, required_permission):
                logger.warning(
                    f"User {current_user.get('uid')} attempted to access {func.__name__} "
                    f"without required permission: {required_permission}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {required_permission}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def require_any_role(required_roles: List[str]):
    """
    Decorator to require any of the specified roles
    
    Usage:
        @router.get("/moderation/reports")
        @require_any_role(["admin", "college_moderator"])
        async def get_reports(current_user = Depends(get_current_user)):
            ...
    
    Args:
        required_roles: List of role strings
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not has_any_role(current_user, required_roles):
                logger.warning(
                    f"User {current_user.get('uid')} attempted to access {func.__name__} "
                    f"without any of required roles: {required_roles}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of: {', '.join(required_roles)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def require_permissions(required_permissions: List[str]):
    """
    Decorator to require all specified permissions
    
    Usage:
        @router.post("/advanced-action")
        @require_permissions(["posts.create", "posts.schedule"])
        async def advanced_action(current_user = Depends(get_current_user)):
            ...
    
    Args:
        required_permissions: List of permission strings
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not has_all_permissions(current_user, required_permissions):
                logger.warning(
                    f"User {current_user.get('uid')} attempted to access {func.__name__} "
                    f"without all required permissions: {required_permissions}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(required_permissions)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def require_college_access(college_id_param: str = "college_id"):
    """
    Decorator to check if moderator has access to specific college
    
    Usage:
        @router.post("/college/{college_id}/verify")
        @require_role("college_moderator")
        @require_college_access("college_id")
        async def verify_student(college_id: str, current_user = Depends(get_current_user)):
            ...
    
    Args:
        college_id_param: Name of the parameter containing college ID
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            college_id = kwargs.get(college_id_param)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not college_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="College ID required"
                )
            
            # Check if user can moderate this college
            if not can_moderate_college(current_user, college_id):
                logger.warning(
                    f"User {current_user.get('uid')} attempted to access college {college_id} "
                    f"without authorization"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not authorized for college {college_id}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def require_ownership_or_permission(permission: str, owner_id_param: str = "user_id"):
    """
    Decorator to check resource ownership or specific permission
    
    Usage:
        @router.put("/posts/{post_id}")
        @require_ownership_or_permission("posts.edit_any", owner_id_param="post_owner_id")
        async def update_post(
            post_id: str,
            post_owner_id: str,
            current_user = Depends(get_current_user)
        ):
            ...
    
    Args:
        permission: Permission that overrides ownership check
        owner_id_param: Name of parameter containing owner ID
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            owner_id = kwargs.get(owner_id_param)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check ownership
            if current_user.get("uid") == owner_id:
                return await func(*args, **kwargs)
            
            # Check permission
            if has_permission(current_user, permission):
                return await func(*args, **kwargs)
            
            logger.warning(
                f"User {current_user.get('uid')} attempted to access resource owned by {owner_id} "
                f"without ownership or permission: {permission}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this resource"
            )
        
        return wrapper
    return decorator

def optional_auth(func: Callable):
    """
    Decorator to make authentication optional but still inject user if present
    
    Usage:
        @router.get("/posts/feed")
        @optional_auth
        async def get_feed(current_user = Depends(get_current_user_optional)):
            # current_user will be None if not authenticated
            ...
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Allow execution even if current_user is None
        return await func(*args, **kwargs)
    
    return wrapper

# Rate limiting decorator (works with authorization)
def rate_limit_by_role(limits: dict):
    """
    Decorator to apply different rate limits based on role
    
    Usage:
        @router.post("/posts")
        @rate_limit_by_role({
            "user": 10,      # 10 posts per hour
            "creator": 50,   # 50 posts per hour
            "admin": None    # No limit
        })
        async def create_post(current_user = Depends(get_current_user)):
            ...
    
    Args:
        limits: Dict mapping role to request limit
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = current_user.get("role", "user")
            limit = limits.get(user_role, limits.get("user", 10))
            
            # If limit is None, no rate limiting
            if limit is None:
                return await func(*args, **kwargs)
            
            # TODO: Implement actual rate limiting logic
            # This is a placeholder for demonstration
            # In production, use Redis or similar for tracking
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Audit logging decorator
def audit_log(action: str, resource_type: str):
    """
    Decorator to log authorized actions for auditing
    
    Usage:
        @router.delete("/users/{user_id}")
        @require_role("admin")
        @audit_log("delete_user", "user")
        async def delete_user(user_id: str, current_user = Depends(get_current_user)):
            ...
    
    Args:
        action: Action being performed
        resource_type: Type of resource being acted upon
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Log action (async, don't block)
            if current_user:
                logger.info(
                    f"AUDIT: User {current_user.get('uid')} performed {action} on {resource_type}"
                )
                # TODO: Write to audit log database
            
            return result
        
        return wrapper
    return decorator