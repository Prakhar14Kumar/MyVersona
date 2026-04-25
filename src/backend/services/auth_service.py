from typing import Optional
from firebase_admin import auth
from .firebase_service import FirebaseService


class AuthService:
    """Authentication service"""
    
    @staticmethod
    async def verify_firebase_token(token: str) -> Optional[dict]:
        """Verify Firebase ID token in a threadpool to prevent blocking"""
        from fastapi.concurrency import run_in_threadpool
        try:
            decoded_token = await run_in_threadpool(auth.verify_id_token, token)
            return decoded_token
        except Exception as e:
            print(f"Firebase token verification error: {e}")
            return None
    
    @staticmethod
    async def get_current_user(token: str) -> Optional[dict]:
        """Get current user from Firebase ID token"""
        payload = await AuthService.verify_firebase_token(token)
        
        if not payload:
            return None
        
        user_id = payload.get("uid")
        if not user_id:
            return None
        
        user = await FirebaseService.get_user(user_id)
        return user
