import asyncio
import os
import uuid
import datetime
from pathlib import Path

# Setup paths to import from backend
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.config import initialize_firebase

# Initialize Firebase first
initialize_firebase()

from backend.services.firebase_service import db
from firebase_admin import storage

IMAGES_DIR = Path(r"F:\MyVersona\images")

async def seed_image_posts():
    print(f"Reading images from {IMAGES_DIR}")
    
    if not IMAGES_DIR.exists():
        print("Images directory does not exist.")
        return

    images = list(IMAGES_DIR.glob("*.jpeg")) + list(IMAGES_DIR.glob("*.jpg")) + list(IMAGES_DIR.glob("*.png"))
    print(f"Found {len(images)} images.")

    bucket = storage.bucket()
    
    # Sample users to assign posts to
    sample_users = [
        {"userId": "sample_user_1", "userName": "Priya Sharma", "userAvatar": "https://images.unsplash.com/photo-1647907213195-308b4413e7bc?w=200&h=200&fit=crop", "userCollege": "#iitdelhi"},
        {"userId": "sample_user_2", "userName": "Tech Recruiters @ Flipkart", "userAvatar": "https://via.placeholder.com/100/FF6F91/FFFFFF?text=FK", "userCollege": "Verified Recruiter 🇮🇳"},
        {"userId": "sample_user_3", "userName": "Arjun Kumar", "userAvatar": "https://via.placeholder.com/100/6DE7C5/FFFFFF?text=AK", "userCollege": "#vitvellore"},
    ]
    
    # Some sample captions
    captions = [
        "Amazing event today! 🚀",
        "Just chilling with friends.",
        "Hackathon mode: ON 💻",
        "Beautiful day on campus ☀️",
        "Networking event was a huge success!",
        "Learning so much lately. Never stop grinding.",
        "Can't believe it's already the end of the semester.",
        "Building the future, one line of code at a time.",
        "Coffee and code ☕",
        "Throwback to last year's fest 🎉",
        "Late night study sessions 📚",
        "Exploring the city!"
    ]

    import shutil
    
    PUBLIC_DEMO_DIR = Path(r"F:\MyVersona\public\demo-images")
    PUBLIC_DEMO_DIR.mkdir(parents=True, exist_ok=True)
    
    for i, img_path in enumerate(images):
        print(f"Processing {img_path.name}...")
        
        # Copy to public/demo-images/
        dest_filename = f"demo_{uuid.uuid4().hex[:8]}_{img_path.name}"
        dest_path = PUBLIC_DEMO_DIR / dest_filename
        shutil.copy2(img_path, dest_path)
        
        # Use local public path
        public_url = f"/demo-images/{dest_filename}"
        
        # Create Post Document
        user = sample_users[i % len(sample_users)]
        caption = captions[i % len(captions)]
        post_type = "career" if i % 3 == 0 else "entertainment"
        
        post_id = str(uuid.uuid4())
        
        post_data = {
            "post_id": post_id,
            "user_id": user["userId"],
            "username": user["userName"].replace(" ", "").lower(),
            "user_avatar": user["userAvatar"],
            "full_name": user["userName"],
            "content": caption,
            "feed_type": post_type,
            "media_urls": [public_url],
            "media_type": "image",
            "hashtags": ["#demo"],
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "bookmarks_count": 0,
            "is_verified_user": True,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "updated_at": datetime.datetime.now(datetime.timezone.utc),
        }
        
        db.collection("posts").document(post_id).set(post_data)
        print(f"Created post for {img_path.name} with URL: {public_url}")

    print("Finished seeding demo posts with images.")

if __name__ == "__main__":
    asyncio.run(seed_image_posts())
