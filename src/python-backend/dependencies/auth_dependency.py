from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

# FastAPI bearer token extractor
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI Dependency to explicitly require a valid Firebase ID Token.
    Returns a dictionary of the user's information from Firebase Auth.
    Throws 401 Unauthorized if missing, malformed, or invalid.
    """
    token = credentials.credentials
    
    try:
        # Verify the token using Firebase Admin SDK
        # This checks the signature, expiration, and issuer
        decoded_token = auth.verify_id_token(token)
        
        # decoded_token contains claims like 'uid', 'email', 'admin'
        return decoded_token
        
    except auth.ExpiredIdTokenError:
        logger.warning("Attempted request with expired Firebase ID token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        logger.warning("Attempted request with revoked Firebase ID token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Attempted request with invalid Firebase ID token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(user: dict = Depends(get_current_user)):
    """
    Can be used to add checks for business logic like email_verified or disabled status.
    """
    if user.get("disabled", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return user
