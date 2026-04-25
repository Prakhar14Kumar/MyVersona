import asyncio
from backend.config import init_firebase

init_firebase()
from backend.services.firebase_service import db

async def seed_data():
    print("Seeding database with sample colleges and trending users...")
    
    # 1. Colleges
    colleges = [
        {
            "name": "IIT Delhi",
            "hashtag": "#iitdelhi",
            "banner": "https://images.unsplash.com/photo-1562774053-701939374585?w=800&fit=crop",
            "members": 15000,
            "posts": 5000,
            "verified": True,
            "location": "New Delhi, India"
        },
        {
            "name": "BITS Pilani",
            "hashtag": "#bitspilani",
            "banner": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&fit=crop",
            "members": 12000,
            "posts": 3500,
            "verified": True,
            "location": "Pilani, India"
        },
        {
            "name": "VIT Vellore",
            "hashtag": "#vitvellore",
            "banner": "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&fit=crop",
            "members": 25000,
            "posts": 8200,
            "verified": True,
            "location": "Vellore, India"
        }
    ]
    
    for college in colleges:
        db.collection("colleges").document(college["hashtag"].replace("#", "")).set(college)
    print("Added colleges.")
    
    # 2. Users
    users = [
        {
            "displayName": "Sanya Ruhela",
            "photoURL": "https://i.pravatar.cc/150?img=1",
            "bio": "Web Developer | Design Enthusiast",
            "college": "#iitdelhi",
            "role": "Student",
            "followers": 15400,
            "posts": 120
        },
        {
            "displayName": "Rahul Kumar",
            "photoURL": "https://i.pravatar.cc/150?img=11",
            "bio": "AI Researcher at BITS",
            "college": "#bitspilani",
            "role": "Alumni",
            "followers": 22300,
            "posts": 450
        },
        {
            "displayName": "Priya Sharma",
            "photoURL": "https://i.pravatar.cc/150?img=5",
            "bio": "Looking for internships!",
            "college": "#vitvellore",
            "role": "Student",
            "followers": 5200,
            "posts": 45
        }
    ]
    
    for user in users:
        db.collection("users").document(user["displayName"].replace(" ", "").lower()).set(user)
    print("Added users.")
    
if __name__ == "__main__":
    asyncio.run(seed_data())
