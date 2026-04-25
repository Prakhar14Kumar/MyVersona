from fastapi import APIRouter, HTTPException, Header, Query, UploadFile, File, Depends
from pydantic import BaseModel
from typing import Optional, List
from models.user import UserProfile, UserUpdate
from services.firebase_service import FirebaseService
from services.auth_service import AuthService
from services.file_validator import FileValidator
from firebase_admin import storage
import uuid
from core.dependencies import get_current_user_id as auth_get_current_user_id

router = APIRouter(prefix="/users", tags=["Users"])

class PublicKeySync(BaseModel):
    public_key: str

@router.post("/sync-user")
async def sync_user_public_key(
    data: PublicKeySync,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Store the user's public key in Firestore for E2EE"""
    try:
        await FirebaseService.update_user(user_id, {"public_key": data.public_key})
        return {"status": "success", "message": "Public key synchronized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync public key: {str(e)}")

@router.get("/me", response_model=UserProfile)
async def get_my_profile(user_id: str = Depends(auth_get_current_user_id)):
    """Get current user's profile"""
    
    user = await FirebaseService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    updates: UserUpdate,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Update current user's profile"""
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    # Check if username is being updated and if it's available
    if "username" in update_data:
        existing = await FirebaseService.get_user_by_username(update_data["username"])
        if existing and existing["uid"] != user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    updated_user = await FirebaseService.update_user(user_id, update_data)
    return updated_user

@router.get("/{username}", response_model=UserProfile)
async def get_user_profile(
    username: str,
    user_id: str = Depends(auth_get_current_user_id)
):
    """Get user profile by username"""
    
    user = await FirebaseService.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/search/", response_model=List[UserProfile])
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    user_id: str = Depends(auth_get_current_user_id)
):
    """Search users by username or name"""
    
    users = await FirebaseService.search_users(q, limit)
    return users

@router.post("/{user_id}/follow")
async def follow_user(
    user_id: str,
    current_user_id: str = Depends(auth_get_current_user_id)
):
    """Follow a user"""
    
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    target_user = await FirebaseService.get_user(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = await FirebaseService.follow_user(current_user_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Already following")
    
    return {"message": "User followed successfully"}

@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: str,
    current_user_id: str = Depends(auth_get_current_user_id)
):
    """Unfollow a user"""
    
    success = await FirebaseService.unfollow_user(current_user_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Not following")
    
    return {"message": "User unfollowed successfully"}

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(auth_get_current_user_id)
):
    """Upload user avatar"""
    
    try:
        # Validate file (size and type)
        await FileValidator.validate_image(file)
        
        # Read file
        contents = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        filename = f"avatars/{user_id}/{uuid.uuid4()}.{file_extension}"
        
        # Upload to Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(filename)
        blob.upload_from_string(contents, content_type=file.content_type)
        
        # Make public and get URL
        blob.make_public()
        url = blob.public_url
        
        # Update user profile
        await FirebaseService.update_user(user_id, {"avatar_url": url})
        
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload-cover")
async def upload_cover(
    file: UploadFile = File(...),
    user_id: str = Depends(auth_get_current_user_id)
):
    """Upload user cover image"""
    
    try:
        # Validate file (size and type)
        await FileValidator.validate_image(file)
        
        # Read file
        contents = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        filename = f"covers/{user_id}/{uuid.uuid4()}.{file_extension}"
        
        # Upload to Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(filename)
        blob.upload_from_string(contents, content_type=file.content_type)
        
        # Make public and get URL
        blob.make_public()
        url = blob.public_url
        
        # Update user profile
        await FirebaseService.update_user(user_id, {"cover_url": url})
        
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")