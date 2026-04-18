from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from firebase_admin import auth
from ..config import settings
from .firebase_service import FirebaseService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Authentication service"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    async def verify_firebase_token(token: str) -> Optional[dict]:
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            print(f"Firebase token verification error: {e}")
            return None
    
    @staticmethod
    async def register_user(email: str, password: str, username: str, full_name: str, phone: Optional[str] = None) -> dict:
        """Register new user"""
        try:
            # Create user in Firebase Auth
            user = auth.create_user(
                email=email,
                password=password,
                display_name=full_name,
                phone_number=phone
            )
            
            # Create user in Firestore
            user_data = {
                "uid": user.uid,
                "email": email,
                "username": username,
                "full_name": full_name,
                "phone": phone,
            }
            
            user_doc = await FirebaseService.create_user(user.uid, user_data)
            
            # Create access token
            access_token = AuthService.create_access_token({"sub": user.uid})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_doc
            }
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")
    
    @staticmethod
    async def login_user(email: str, password: str) -> dict:
        """Login user with email and password"""
        try:
            # Get user from Firestore
            user = await FirebaseService.get_user_by_email(email)
            
            if not user:
                raise Exception("User not found")
            
            # For Firebase Auth users, we need to use Firebase SDK
            # This is a simplified version - in production, use Firebase Auth REST API
            # to verify credentials
            
            # Create access token
            access_token = AuthService.create_access_token({"sub": user["uid"]})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user
            }
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")
    
    @staticmethod
    async def get_current_user(token: str) -> Optional[dict]:
        """Get current user from token"""
        payload = AuthService.verify_token(token)
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = await FirebaseService.get_user(user_id)
        return user
