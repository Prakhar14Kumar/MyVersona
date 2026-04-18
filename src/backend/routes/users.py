from fastapi import APIRouter, HTTPException, Header, Query, UploadFile, File
from typing import Optional, List
from ..models.user import UserProfile, UserUpdate
from ..services.firebase_service import FirebaseService
from ..services.auth_service import AuthService
from ..services.file_validator import FileValidator
from firebase_admin import storage
import uuid

router = APIRouter(prefix="/users", tags=["Users"])

async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Get current user ID from auth header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    user = await AuthService.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user["uid"]

@router.get("/me", response_model=UserProfile)
async def get_my_profile(authorization: Optional[str] = Header(None)):
    """Get current user's profile"""
    user_id = await get_current_user_id(authorization)
    
    user = await FirebaseService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    updates: UserUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update current user's profile"""
    user_id = await get_current_user_id(authorization)
    
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
    authorization: Optional[str] = Header(None)
):
    """Get user profile by username"""
    await get_current_user_id(authorization)
    
    user = await FirebaseService.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/search/", response_model=List[UserProfile])
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    authorization: Optional[str] = Header(None)
):
    """Search users by username or name"""
    await get_current_user_id(authorization)
    
    users = await FirebaseService.search_users(q, limit)
    return users

@router.post("/{user_id}/follow")
async def follow_user(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """Follow a user"""
    current_user_id = await get_current_user_id(authorization)
    
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
    authorization: Optional[str] = Header(None)
):
    """Unfollow a user"""
    current_user_id = await get_current_user_id(authorization)
    
    success = await FirebaseService.unfollow_user(current_user_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Not following")
    
    return {"message": "User unfollowed successfully"}

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload user avatar"""
    user_id = await get_current_user_id(authorization)
    
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
    authorization: Optional[str] = Header(None)
):
    """Upload user cover image"""
    user_id = await get_current_user_id(authorization)
    
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