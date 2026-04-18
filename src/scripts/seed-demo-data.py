#!/usr/bin/env python3
"""
VerSona - Demo Data Seeding Script
===================================

Generates realistic demo data for presentations:
- 15 fake users with profiles
- 50 posts (mix of entertainment and career)
- 30 comments
- 10 conversations with messages
- Notifications

Usage:
    python scripts/seed-demo-data.py

Requirements:
    pip install faker firebase-admin
"""

import os
import sys
from datetime import datetime, timedelta
import random
from typing import List, Dict
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from faker import Faker
    import firebase_admin
    from firebase_admin import credentials, firestore, auth
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install faker firebase-admin")
    sys.exit(1)


# Initialize Faker for Indian locale
fake = Faker(['en_IN', 'en_US'])

# Configuration
NUM_USERS = 15
NUM_POSTS = 50
NUM_COMMENTS = 30
NUM_CONVERSATIONS = 10
MESSAGES_PER_CONVERSATION = 5

# Indian colleges
INDIAN_COLLEGES = [
    "IIT Delhi", "IIT Bombay", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
    "BITS Pilani", "NIT Trichy", "NIT Warangal", "IIIT Hyderabad",
    "Delhi University", "Mumbai University", "Pune University",
    "VIT Vellore", "Manipal Institute", "SRM University"
]

# Skills
SKILLS = [
    "Python", "JavaScript", "React", "Node.js", "Machine Learning",
    "Data Science", "UI/UX Design", "Digital Marketing", "Content Writing",
    "Photography", "Video Editing", "Public Speaking", "Leadership",
    "Java", "C++", "Flutter", "Firebase", "AWS", "Docker"
]

# Interests
INTERESTS = [
    "Technology", "Photography", "Music", "Sports", "Travel",
    "Reading", "Coding", "Gaming", "Fitness", "Art",
    "Entrepreneurship", "Social Media", "Blogging", "Dance"
]

# Post templates
ENTERTAINMENT_POSTS = [
    "Just finished an amazing photoshoot at {location}! 📸✨",
    "Weekend vibes at {location} with the squad! 🎉",
    "Coffee and code - the perfect combo ☕💻",
    "Sunset views from campus today 🌅",
    "First day of the semester and already stressed 😅",
    "Anyone else procrastinating assignments? 🙋‍♂️",
    "Campus fest was lit! 🔥",
    "Trying out a new cafe near campus ☕",
    "Late night coding sessions hit different 💻🌙",
    "Found the perfect study spot! 📚",
]

CAREER_POSTS = [
    "Excited to announce I've been selected for a {company} internship! 🎉",
    "Just completed my certification in {skill}! 🏆",
    "Looking for internship opportunities in {field}. Any leads?",
    "Attended an amazing workshop on {topic} today! 💡",
    "My resume got shortlisted for {company}! Fingers crossed 🤞",
    "Tips for cracking technical interviews? Need your help!",
    "Built my first {project} project! Check it out 🚀",
    "Participated in a hackathon this weekend. Such a learning experience!",
    "Got my first freelance client! Starting my {field} journey 💼",
    "Any advice for someone starting in {field}?",
]

COMPANIES = ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy", "Zomato", "Paytm"]
FIELDS = ["Web Development", "Data Science", "UI/UX Design", "Digital Marketing", "Content Writing"]
TOPICS = ["AI/ML", "Web3", "Cloud Computing", "Product Management", "Startup Building"]
PROJECTS = ["React", "Flutter", "Machine Learning", "Full-stack"]
LOCATIONS = ["India Gate", "Marine Drive", "Cubbon Park", "Gateway of India", "Qutub Minar"]

# Comments
COMMENT_TEMPLATES = [
    "This is amazing! 🔥",
    "Congratulations! Well deserved 🎉",
    "Super proud of you! 💪",
    "Can you share more details?",
    "This is so inspiring!",
    "Love this! ❤️",
    "Great work! Keep it up 👏",
    "Wow, impressive!",
    "How did you do this?",
    "This is so cool!",
    "Would love to know more about this!",
    "Congratulations on this achievement!",
    "You're killing it! 🚀",
    "This made my day!",
    "Absolutely brilliant!",
]


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
    except ValueError:
        # Not initialized, initialize now
        cred_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'firebase-credentials.json')
        
        if not os.path.exists(cred_path):
            print("❌ Firebase credentials not found at:", cred_path)
            print("   Please download your service account key and save it as firebase-credentials.json")
            sys.exit(1)
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized")
    
    return firestore.client()


def generate_user_data() -> List[Dict]:
    """Generate fake user data"""
    users = []
    
    for i in range(NUM_USERS):
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        user = {
            'email': f"{first_name.lower()}.{last_name.lower()}@demo.versona.app",
            'password': 'Demo@123',
            'profile': {
                'name': f"{first_name} {last_name}",
                'bio': fake.sentence(nb_words=10),
                'college': random.choice(INDIAN_COLLEGES),
                'year': random.choice(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']),
                'skills': random.sample(SKILLS, k=random.randint(3, 6)),
                'interests': random.sample(INTERESTS, k=random.randint(3, 5)),
                'location': fake.city(),
                'profilePicture': f"https://ui-avatars.com/api/?name={first_name}+{last_name}&background=random",
                'followers': random.randint(50, 500),
                'following': random.randint(30, 300),
                'verified': random.choice([True, False]),
                'createdAt': datetime.now() - timedelta(days=random.randint(30, 365))
            }
        }
        users.append(user)
    
    print(f"✅ Generated {len(users)} users")
    return users


def create_firebase_users(db, users: List[Dict]) -> List[Dict]:
    """Create users in Firebase Auth and Firestore"""
    created_users = []
    
    for user_data in users:
        try:
            # Create user in Firebase Auth
            user = auth.create_user(
                email=user_data['email'],
                password=user_data['password'],
                display_name=user_data['profile']['name']
            )
            
            # Add user to Firestore
            profile = user_data['profile']
            profile['uid'] = user.uid
            profile['email'] = user_data['email']
            
            db.collection('users').document(user.uid).set(profile)
            
            created_users.append({
                'uid': user.uid,
                'email': user_data['email'],
                'profile': profile
            })
            
            print(f"  ✓ Created user: {user_data['profile']['name']} ({user_data['email']})")
            
        except Exception as e:
            print(f"  ✗ Error creating user {user_data['email']}: {e}")
    
    print(f"\n✅ Created {len(created_users)} users in Firebase")
    return created_users


def generate_posts(db, users: List[Dict]):
    """Generate fake posts"""
    posts_created = 0
    
    for i in range(NUM_POSTS):
        user = random.choice(users)
        feed_type = random.choice(['entertainment', 'career'])
        
        if feed_type == 'entertainment':
            content = random.choice(ENTERTAINMENT_POSTS).format(
                location=random.choice(LOCATIONS)
            )
        else:
            content = random.choice(CAREER_POSTS).format(
                company=random.choice(COMPANIES),
                skill=random.choice(SKILLS),
                field=random.choice(FIELDS),
                topic=random.choice(TOPICS),
                project=random.choice(PROJECTS)
            )
        
        post = {
            'userId': user['uid'],
            'userName': user['profile']['name'],
            'userCollege': user['profile']['college'],
            'content': content,
            'feedType': feed_type,
            'likes': random.randint(5, 100),
            'comments': random.randint(0, 20),
            'shares': random.randint(0, 10),
            'timestamp': datetime.now() - timedelta(days=random.randint(0, 30)),
            'hashtags': [],
            'media': []
        }
        
        # Add post to Firestore
        db.collection('posts').add(post)
        posts_created += 1
    
    print(f"\n✅ Created {posts_created} posts")


def generate_comments(db, users: List[Dict]):
    """Generate fake comments on posts"""
    posts = db.collection('posts').limit(30).stream()
    comments_created = 0
    
    for post in posts:
        num_comments = random.randint(0, 5)
        
        for _ in range(num_comments):
            user = random.choice(users)
            
            comment = {
                'postId': post.id,
                'userId': user['uid'],
                'userName': user['profile']['name'],
                'content': random.choice(COMMENT_TEMPLATES),
                'timestamp': datetime.now() - timedelta(days=random.randint(0, 10)),
                'likes': random.randint(0, 20)
            }
            
            db.collection('comments').add(comment)
            comments_created += 1
    
    print(f"✅ Created {comments_created} comments")


def generate_conversations(db, users: List[Dict]):
    """Generate fake conversations and messages"""
    conversations_created = 0
    
    for _ in range(NUM_CONVERSATIONS):
        user1 = random.choice(users)
        user2 = random.choice([u for u in users if u['uid'] != user1['uid']])
        
        chat_mode = random.choice(['casual', 'professional'])
        
        conversation = {
            'participants': [user1['uid'], user2['uid']],
            'participantNames': {
                user1['uid']: user1['profile']['name'],
                user2['uid']: user2['profile']['name']
            },
            'chatMode': chat_mode,
            'lastMessage': '',
            'lastMessageTime': datetime.now(),
            'createdAt': datetime.now() - timedelta(days=random.randint(1, 30))
        }
        
        # Create conversation
        conv_ref = db.collection('conversations').add(conversation)
        conv_id = conv_ref[1].id
        
        # Create messages
        for i in range(MESSAGES_PER_CONVERSATION):
            sender = random.choice([user1, user2])
            
            if chat_mode == 'casual':
                messages = [
                    "Hey! How's it going?",
                    "Pretty good! How about you?",
                    "Want to grab coffee sometime?",
                    "Sure! When are you free?",
                    "How about tomorrow at 4?",
                    "Sounds good! See you then 😊",
                ]
            else:
                messages = [
                    "Hi, I wanted to discuss the project opportunity.",
                    "Sure, I'd be happy to discuss it.",
                    "Could you share more details about the role?",
                    "Of course. Let me send you the JD.",
                    "Thank you. When can we schedule a call?",
                    "How about this Friday at 3 PM?",
                ]
            
            message = {
                'conversationId': conv_id,
                'senderId': sender['uid'],
                'senderName': sender['profile']['name'],
                'content': messages[i % len(messages)],
                'timestamp': datetime.now() - timedelta(days=random.randint(0, 10), hours=i),
                'read': random.choice([True, False])
            }
            
            db.collection('messages').add(message)
        
        conversations_created += 1
    
    print(f"✅ Created {conversations_created} conversations with messages")


def print_summary(users: List[Dict]):
    """Print summary of created demo data"""
    print("\n" + "="*60)
    print("✅ DEMO DATA SEEDING COMPLETE")
    print("="*60)
    
    print(f"\nCreated:")
    print(f"  - {len(users)} users")
    print(f"  - {NUM_POSTS} posts")
    print(f"  - ~{NUM_COMMENTS} comments")
    print(f"  - {NUM_CONVERSATIONS} conversations")
    print(f"  - ~{NUM_CONVERSATIONS * MESSAGES_PER_CONVERSATION} messages")
    
    print("\n📧 Demo Account Credentials:")
    print("-" * 60)
    for user in users[:5]:  # Show first 5 users
        print(f"  Email: {user['email']}")
        print(f"  Password: Demo@123")
        print(f"  Name: {user['profile']['name']}")
        print(f"  College: {user['profile']['college']}")
        print()
    
    print("💡 Tips:")
    print("  - All passwords are: Demo@123")
    print("  - Use these accounts for live demo")
    print("  - Profiles have realistic data (skills, interests, bio)")
    print("  - Mix of entertainment and career posts")
    print("\n" + "="*60)


def main():
    """Main function"""
    print("="*60)
    print("VerSona - Demo Data Seeding Script")
    print("="*60)
    print()
    
    # Initialize Firebase
    db = initialize_firebase()
    
    # Generate user data
    print("\n📝 Generating user data...")
    users_data = generate_user_data()
    
    # Create users in Firebase
    print("\n👤 Creating users in Firebase Auth and Firestore...")
    users = create_firebase_users(db, users_data)
    
    if not users:
        print("❌ No users created. Exiting.")
        return
    
    # Generate posts
    print("\n📝 Creating posts...")
    generate_posts(db, users)
    
    # Generate comments
    print("\n💬 Creating comments...")
    generate_comments(db, users)
    
    # Generate conversations
    print("\n💬 Creating conversations and messages...")
    generate_conversations(db, users)
    
    # Print summary
    print_summary(users)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
