import firebase_admin
from firebase_admin import credentials
import logging
import json
from .config import settings

logger = logging.getLogger(__name__)

def setup_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        logger.info("Firebase Admin SDK already initialized.")
    except ValueError:
        try:
            # First try loading from explicit env vars (useful for Vercel/Render)
            if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PRIVATE_KEY and settings.FIREBASE_CLIENT_EMAIL:
                # Fix line breaks in private key if loaded from envar string
                private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
                
                cert_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key_id": "versona_key", # Placeholder
                    "private_key": private_key,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "client_id": "versona_client",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL}"
                }
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                logger.info("✅ Firebase Admin SDK initialized via dict.")
            else:
                # Default to application default credentials (e.g. from GOOGLE_APPLICATION_CREDENTIALS)
                # Or local service account JSON file
                try:
                    cred = credentials.Certificate("firebase-service-account.json")
                    firebase_admin.initialize_app(cred)
                    logger.info("✅ Firebase Admin SDK initialized via manual JSON file.")
                except Exception as file_error:
                    # Initialize without explicit creds (relies on env variables set in GCP/AWS)
                    firebase_admin.initialize_app()
                    logger.info("✅ Firebase Admin SDK initialized via Default Context.")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Firebase Admin SDK: {str(e)}")
            # Raise exception so app doesn't start without security
            # raise Exception("Firebase Admin setup failed")
