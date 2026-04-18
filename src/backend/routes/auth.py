from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from ..models.user import UserCreate, UserLogin, TokenResponse, UserProfile
from ..services.auth_service import AuthService
from ..services.firebase_service import FirebaseService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register new user"""
    try:
        # Check if username exists
        existing_user = await FirebaseService.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Check if email exists
        existing_email = await FirebaseService.get_user_by_email(user_data.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Register user
        result = await AuthService.register_user(
            email=user_data.email,
            password=user_data.password,
            username=user_data.username,
            full_name=user_data.full_name,
            phone=user_data.phone
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    try:
        result = await AuthService.login_user(
            email=credentials.email,
            password=credentials.password
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/firebase-login", response_model=TokenResponse)
async def firebase_login(firebase_token: str):
    """Login with Firebase token (Google, Phone OTP, etc.)"""
    try:
        # Verify Firebase token
        decoded = await AuthService.verify_firebase_token(firebase_token)
        if not decoded:
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
        
        uid = decoded.get("uid")
        email = decoded.get("email")
        
        # Get or create user
        user = await FirebaseService.get_user(uid)
        
        if not user:
            # Create new user from Firebase auth
            user_data = {
                "uid": uid,
                "email": email,
                "username": email.split("@")[0],  # Default username
                "full_name": decoded.get("name", ""),
            }
            user = await FirebaseService.create_user(uid, user_data)
        
        # Create access token
        access_token = AuthService.create_access_token({"sub": uid})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserProfile)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    user = await AuthService.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user

@router.post("/logout")
async def logout():
    """Logout user"""
    # JWT tokens are stateless, logout is handled client-side
    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(authorization: Optional[str] = Header(None)):
    """
    Refresh access token
    Allows extending the session before token expires
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify current token and get user
        user = await AuthService.get_current_user(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        # Verify user still exists in Firebase
        user_exists = await FirebaseService.get_user(user["uid"])
        if not user_exists:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Generate new token
        new_token = AuthService.create_access_token({"sub": user["uid"]})
        
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "user": user_exists,
            "expires_in": 7 * 24 * 60 * 60  # 7 days in seconds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")