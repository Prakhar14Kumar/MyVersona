"""
VerSona Authorization System

Provides role-based access control for API routes and WebSocket events.

Usage:
    from core.auth import require_role, require_permission, has_role
    
    @router.get("/admin/users")
    @require_role("admin")
    async def get_users(current_user = Depends(get_current_user)):
        ...
"""

# Role management
from .roles import (
    Role,
    has_role,
    has_permission,
    has_any_role,
    has_all_permissions,
    can_access_resource,
    can_moderate_college,
    get_user_role_info,
    get_all_permissions,
    has_permission_group,
    ROLE_HIERARCHY,
    PERMISSIONS,
    PERMISSION_GROUPS
)

# Decorators
from .decorators import (
    require_role,
    require_permission,
    require_any_role,
    require_permissions,
    require_college_access,
    require_ownership_or_permission,
    optional_auth,
    rate_limit_by_role,
    audit_log
)

# Caching
from .cache import (
    permission_cache,
    token_claims_cache,
    cache_user_permissions,
    get_cached_user_permissions,
    invalidate_user_permissions,
    get_cache_stats,
    cache_users_batch,
    invalidate_users_batch,
    warm_cache
)

__all__ = [
    # Roles
    "Role",
    "has_role",
    "has_permission",
    "has_any_role",
    "has_all_permissions",
    "can_access_resource",
    "can_moderate_college",
    "get_user_role_info",
    "get_all_permissions",
    "has_permission_group",
    "ROLE_HIERARCHY",
    "PERMISSIONS",
    "PERMISSION_GROUPS",
    
    # Decorators
    "require_role",
    "require_permission",
    "require_any_role",
    "require_permissions",
    "require_college_access",
    "require_ownership_or_permission",
    "optional_auth",
    "rate_limit_by_role",
    "audit_log",
    
    # Cache
    "permission_cache",
    "token_claims_cache",
    "cache_user_permissions",
    "get_cached_user_permissions",
    "invalidate_user_permissions",
    "get_cache_stats",
    "cache_users_batch",
    "invalidate_users_batch",
    "warm_cache",
]
