"""
Role-based authorization for VerSona
Defines roles, permissions, and role hierarchy
"""

from enum import Enum
from typing import List, Dict, Set
from datetime import datetime

class Role(str, Enum):
    """User roles in the system"""
    USER = "user"
    CREATOR = "creator"
    COLLEGE_MODERATOR = "college_moderator"
    ADMIN = "admin"

# Role hierarchy (higher roles inherit permissions from lower roles)
ROLE_HIERARCHY = {
    Role.USER: [],
    Role.CREATOR: [Role.USER],
    Role.COLLEGE_MODERATOR: [Role.CREATOR, Role.USER],
    Role.ADMIN: [Role.COLLEGE_MODERATOR, Role.CREATOR, Role.USER]
}

# Permission definitions
PERMISSIONS = {
    # User permissions (default)
    Role.USER: {
        "posts.create",
        "posts.read",
        "posts.update_own",
        "posts.delete_own",
        "posts.like",
        "posts.comment",
        "posts.share",
        "posts.bookmark",
        
        "profile.read",
        "profile.update_own",
        
        "comments.create",
        "comments.read",
        "comments.delete_own",
        
        "messages.send",
        "messages.read",
        
        "users.follow",
        "users.unfollow",
        "users.search",
        
        "communities.join",
        "communities.leave",
        "communities.read",
        
        "media.upload_small",
        
        "notifications.receive",
    },
    
    # Creator permissions (additional)
    Role.CREATOR: {
        "analytics.read_own",
        "analytics.dashboard",
        
        "posts.schedule",
        "posts.poll_create",
        "posts.advanced_stats",
        
        "media.upload_large",
        "media.upload_video",
        
        "creator.dashboard",
        "creator.insights",
        "creator.monetization",
    },
    
    # College Moderator permissions (additional)
    Role.COLLEGE_MODERATOR: {
        "moderation.view_reports",
        "moderation.review_content",
        "moderation.remove_content",
        "moderation.ban_users",
        "moderation.dashboard",
        
        "college.verify_students",
        "college.pin_posts",
        "college.announcements",
        "college.manage_members",
        
        "reports.create",
        "reports.view_own",
        "reports.resolve",
    },
    
    # Admin permissions (full access)
    Role.ADMIN: {
        "admin.dashboard",
        "admin.system_config",
        
        "users.read_all",
        "users.update_all",
        "users.delete_all",
        "users.assign_roles",
        "users.suspend",
        
        "posts.delete_any",
        "posts.edit_any",
        
        "moderation.global",
        "moderation.audit_logs",
        
        "system.settings",
        "system.logs",
        "system.analytics",
        "system.features",
        
        "roles.create",
        "roles.update",
        "roles.delete",
        "roles.assign",
    }
}

def get_all_permissions(role: Role) -> Set[str]:
    """
    Get all permissions for a role including inherited permissions
    
    Args:
        role: Role enum
        
    Returns:
        Set of all permissions for this role
    """
    permissions = set()
    
    # Add direct permissions
    if role in PERMISSIONS:
        permissions.update(PERMISSIONS[role])
    
    # Add inherited permissions
    if role in ROLE_HIERARCHY:
        for inherited_role in ROLE_HIERARCHY[role]:
            permissions.update(get_all_permissions(inherited_role))
    
    return permissions

def has_role(user: dict, required_role: str) -> bool:
    """
    Check if user has the required role or higher
    
    Args:
        user: User dict with 'role' field
        required_role: Required role string
        
    Returns:
        True if user has required role or higher
    """
    user_role = user.get("role", Role.USER)
    
    # Exact match
    if user_role == required_role:
        return True
    
    # Check if user's role inherits required role
    try:
        user_role_enum = Role(user_role)
        required_role_enum = Role(required_role)
        
        # Admin has all roles
        if user_role_enum == Role.ADMIN:
            return True
        
        # Check hierarchy
        return required_role_enum in ROLE_HIERARCHY.get(user_role_enum, [])
    except ValueError:
        return False

def has_permission(user: dict, required_permission: str) -> bool:
    """
    Check if user has a specific permission
    
    Args:
        user: User dict with 'role' field
        required_permission: Permission string (e.g., "posts.delete_any")
        
    Returns:
        True if user has permission
    """
    user_role = user.get("role", Role.USER)
    
    try:
        role_enum = Role(user_role)
        user_permissions = get_all_permissions(role_enum)
        
        # Check direct permission
        if required_permission in user_permissions:
            return True
        
        # Check custom permissions
        custom_permissions = user.get("permissions", [])
        if required_permission in custom_permissions:
            return True
        
        return False
    except ValueError:
        return False

def has_any_role(user: dict, required_roles: List[str]) -> bool:
    """
    Check if user has any of the required roles
    
    Args:
        user: User dict with 'role' field
        required_roles: List of role strings
        
    Returns:
        True if user has at least one of the roles
    """
    return any(has_role(user, role) for role in required_roles)

def has_all_permissions(user: dict, required_permissions: List[str]) -> bool:
    """
    Check if user has all required permissions
    
    Args:
        user: User dict with 'role' field
        required_permissions: List of permission strings
        
    Returns:
        True if user has all permissions
    """
    return all(has_permission(user, perm) for perm in required_permissions)

def can_access_resource(user: dict, resource_owner_id: str, required_permission: str = None) -> bool:
    """
    Check if user can access a resource (ownership or permission)
    
    Args:
        user: User dict
        resource_owner_id: User ID of resource owner
        required_permission: Optional permission that overrides ownership
        
    Returns:
        True if user owns resource or has required permission
    """
    # User owns the resource
    if user.get("uid") == resource_owner_id:
        return True
    
    # User has permission to access any resource
    if required_permission and has_permission(user, required_permission):
        return True
    
    return False

def can_moderate_college(user: dict, college_id: str) -> bool:
    """
    Check if user can moderate a specific college
    
    Args:
        user: User dict with 'role' and 'assigned_colleges' fields
        college_id: College ID to check
        
    Returns:
        True if user can moderate this college
    """
    # Admins can moderate all colleges
    if has_role(user, Role.ADMIN):
        return True
    
    # Check if moderator is assigned to this college
    if has_role(user, Role.COLLEGE_MODERATOR):
        assigned_colleges = user.get("assigned_colleges", [])
        return college_id in assigned_colleges
    
    return False

def get_user_role_info(user: dict) -> Dict:
    """
    Get comprehensive role information for a user
    
    Args:
        user: User dict
        
    Returns:
        Dict with role information
    """
    user_role = user.get("role", Role.USER)
    
    try:
        role_enum = Role(user_role)
        permissions = get_all_permissions(role_enum)
        
        return {
            "role": user_role,
            "permissions": list(permissions),
            "can_moderate": has_role(user, Role.COLLEGE_MODERATOR),
            "is_admin": has_role(user, Role.ADMIN),
            "is_creator": has_role(user, Role.CREATOR),
            "assigned_colleges": user.get("assigned_colleges", []),
            "custom_permissions": user.get("permissions", [])
        }
    except ValueError:
        return {
            "role": Role.USER,
            "permissions": list(PERMISSIONS[Role.USER]),
            "can_moderate": False,
            "is_admin": False,
            "is_creator": False,
            "assigned_colleges": [],
            "custom_permissions": []
        }

# Permission groups for common checks
PERMISSION_GROUPS = {
    "content_moderation": [
        "moderation.view_reports",
        "moderation.remove_content",
        "moderation.ban_users"
    ],
    "user_management": [
        "users.read_all",
        "users.update_all",
        "users.assign_roles"
    ],
    "analytics_access": [
        "analytics.read_own",
        "analytics.dashboard"
    ]
}

def has_permission_group(user: dict, group_name: str) -> bool:
    """
    Check if user has all permissions in a group
    
    Args:
        user: User dict
        group_name: Name of permission group
        
    Returns:
        True if user has all permissions in group
    """
    if group_name not in PERMISSION_GROUPS:
        return False
    
    return has_all_permissions(user, PERMISSION_GROUPS[group_name])
