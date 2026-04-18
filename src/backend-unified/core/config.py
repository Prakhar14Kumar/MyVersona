"""
Core Configuration - Shared across all modules
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import json
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # ==================== APP SETTINGS ====================
    APP_NAME: str = "VerSona"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # ==================== SERVER SETTINGS ====================
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # ==================== SECURITY ====================
    SECRET_KEY: str  # No default - must be set in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # ==================== FIREBASE ====================
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    
    # ==================== REDIS (for caching + Celery) ====================
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None  # Override if using Redis Cloud
    
    # ==================== CELERY (Task Queue) ====================
    CELERY_BROKER_URL: Optional[str] = None  # Auto-constructed from Redis
    CELERY_RESULT_BACKEND: Optional[str] = None  # Auto-constructed from Redis
    
    # ==================== AI/ML SETTINGS ====================
    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    
    # OpenAI (if needed)
    OPENAI_API_KEY: Optional[str] = None
    
    # Model paths (for local ML models)
    ML_MODELS_PATH: str = "./modules/ai/trained_models"
    
    # ==================== CORS ====================
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # ==================== RATE LIMITING ====================
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # ==================== WEBSOCKET SETTINGS ====================
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_MAX_CONNECTIONS_PER_USER: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# ==================== INITIALIZE SETTINGS ====================

settings = Settings()

# Auto-construct Celery URLs from Redis settings
if not settings.CELERY_BROKER_URL:
    if settings.REDIS_URL:
        settings.CELERY_BROKER_URL = settings.REDIS_URL
    elif settings.REDIS_PASSWORD:
        settings.CELERY_BROKER_URL = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    else:
        settings.CELERY_BROKER_URL = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

if not settings.CELERY_RESULT_BACKEND:
    settings.CELERY_RESULT_BACKEND = settings.CELERY_BROKER_URL


# ==================== VALIDATION ====================

# Validate critical settings on startup
if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key-change-in-production":
    raise ValueError(
        "SECRET_KEY must be set in .env file! "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )


# ==================== FIREBASE INITIALIZATION ====================

_firebase_initialized = False

def initialize_firebase():
    """
    Initialize Firebase Admin SDK globally (shared across all modules)
    
    This is called once at startup and provides:
    - Firestore database access
    - Firebase Authentication
    - Firebase Storage
    """
    global _firebase_initialized
    
    if _firebase_initialized:
        logger.info("Firebase already initialized")
        return True
    
    try:
        if not firebase_admin._apps:
            # Method 1: Load from file path
            if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                logger.info(f"Loading Firebase credentials from: {settings.FIREBASE_CREDENTIALS_PATH}")
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            
            # Method 2: Load from environment variable (JSON string)
            elif os.getenv("FIREBASE_CONFIG"):
                logger.info("Loading Firebase credentials from FIREBASE_CONFIG env var")
                firebase_config = os.getenv("FIREBASE_CONFIG")
                cred = credentials.Certificate(json.loads(firebase_config))
            
            # Method 3: Use default credentials (for development)
            else:
                logger.warning("No Firebase credentials found - using application default credentials")
                logger.warning("This may not work in production!")
                cred = credentials.ApplicationDefault()
            
            # Initialize Firebase Admin SDK
            firebase_admin.initialize_app(cred, {
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET or 'versona-app.appspot.com',
                'projectId': settings.FIREBASE_PROJECT_ID
            })
            
            logger.info("✅ Firebase Admin SDK initialized successfully")
            _firebase_initialized = True
            return True
            
    except Exception as e:
        logger.error(f"❌ Firebase initialization error: {e}")
        logger.error("The server will start but Firebase features will not work!")
        return False


# ==================== FIREBASE CLIENT GETTERS ====================

def get_firestore_client():
    """
    Get Firestore database client
    
    Usage:
        db = get_firestore_client()
        users_ref = db.collection('users')
    """
    if not _firebase_initialized:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return firestore.client()


def get_auth_client():
    """
    Get Firebase Auth client
    
    Usage:
        auth_client = get_auth_client()
        user = auth_client.verify_id_token(token)
    """
    if not _firebase_initialized:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return auth


def get_storage_client():
    """
    Get Firebase Storage bucket client
    
    Usage:
        bucket = get_storage_client()
        blob = bucket.blob('path/to/file.jpg')
    """
    if not _firebase_initialized:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return storage.bucket()


# ==================== EXPORT ====================

__all__ = [
    'settings',
    'initialize_firebase',
    'get_firestore_client',
    'get_auth_client',
    'get_storage_client'
]
