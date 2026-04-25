import asyncio
import sys
import os
import firebase_admin
from firebase_admin import credentials

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Initialize Firebase App
try:
    firebase_admin.get_app()
except ValueError:
    import json
    from dotenv import load_dotenv
    load_dotenv()
    
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if cred_json:
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials if using local emulator or application default credentials
        firebase_admin.initialize_app()

from src.backend.services.firebase_service import FirebaseService

async def main():
    import logging
    logging.basicConfig(level=logging.INFO)
    print("Testing get_feed_posts...")
    try:
        posts = await FirebaseService.get_feed_posts("entertainment", 5)
        print(f"Success! Got {len(posts)} posts.")
        for p in posts:
            print(p.get("post_id"), p.get("type"), p.get("createdAt"))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
