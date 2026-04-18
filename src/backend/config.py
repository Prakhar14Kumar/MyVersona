import os
import json
from typing import Optional, List

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage

# ✅ Load .env file properly
load_dotenv()


# =========================
# SETTINGS CLASS
# =========================
class Settings(BaseSettings):
    # App
    APP_NAME: str = "VerSona"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "dev-secret-key"  # fallback to avoid crash
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Firebase
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = "versona-app.appspot.com"

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Initialize settings
settings = Settings()


# =========================
# VALIDATION (SAFE)
# =========================
if settings.SECRET_KEY == "dev-secret-key":
    print("⚠️ WARNING: Using default SECRET_KEY (set in .env for production)")


# =========================
# FIREBASE INIT
# =========================
def initialize_firebase():
    """Initialize Firebase Admin SDK safely"""
    try:
        if not firebase_admin._apps:

            # Option 1: From file
            if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)

            # Option 2: From ENV JSON
            elif os.getenv("FIREBASE_CONFIG"):
                firebase_config = json.loads(os.getenv("FIREBASE_CONFIG"))
                cred = credentials.Certificate(firebase_config)

            # Option 3: Default (dev only)
            else:
                print("⚠️ Using default Firebase credentials (dev mode)")
                cred = credentials.ApplicationDefault()

            firebase_admin.initialize_app(cred, {
                "storageBucket": settings.FIREBASE_STORAGE_BUCKET
            })

            print("✅ Firebase initialized successfully")

        return True

    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return False


# =========================
# FIREBASE CLIENTS
# =========================
def get_firestore_client():
    return firestore.client()


def get_auth_client():
    return auth


def get_storage_client():
    return storage.bucket()