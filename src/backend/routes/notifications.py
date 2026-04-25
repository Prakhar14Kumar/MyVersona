from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from core.auth.decorators import get_current_user
from services.firebase_service import FirebaseService
from models.notification import Notification
from core.dependencies import get_current_user_id as auth_get_current_user_id


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
async def get_notifications(
    limit: int = Query(50, le=100),
    unread_only: bool = Query(False),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get notifications for current user
    
    - **limit**: Maximum number of notifications to return (max 100)
    - **unread_only**: Return only unread notifications
    - **cursor**: Pagination cursor
    """
    try:
        user_id = current_user["uid"]
        
        notifications = await FirebaseService.get_user_notifications(
            user_id=user_id,
            limit=limit,
            unread_only=unread_only,
            cursor=cursor
        )
        
        # Get next cursor if there are more notifications
        next_cursor = notifications[-1]["notification_id"] if len(notifications) == limit else None
        
        return {
            "success": True,
            "notifications": notifications,
            "count": len(notifications),
            "next_cursor": next_cursor,
            "unread_only": unread_only
        }
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    try:
        user_id = current_user["uid"]
        
        success = await FirebaseService.mark_notification_read(notification_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found or access denied")
        
        return {
            "success": True,
            "message": "Notification marked as read",
            "notification_id": notification_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark notification read error: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        user_id = current_user["uid"]
        
        success = await FirebaseService.mark_all_notifications_read(user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")
        
        return {
            "success": True,
            "message": "All notifications marked as read"
        }
    except Exception as e:
        logger.error(f"Mark all notifications read error: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        user_id = current_user["uid"]
        
        success = await FirebaseService.delete_notification(notification_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found or access denied")
        
        return {
            "success": True,
            "message": "Notification deleted",
            "notification_id": notification_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete notification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")
