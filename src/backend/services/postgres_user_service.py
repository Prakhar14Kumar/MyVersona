from sqlalchemy.future import select
from src.backend.models.user_models import User
from src.backend.core.database import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)

class PostgresUserService:
    @staticmethod
    async def search_users(query: str, current_user_id: str, limit: int = 10):
        async with AsyncSessionLocal() as session:
            stmt = select(User).where(
                User.name.ilike(f"%{query}%"),
                User.id != current_user_id
            ).limit(limit)
            
            result = await session.execute(stmt)
            users = result.scalars().all()
            
            return [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "college": u.college
                } for u in users
            ]


    @staticmethod
    async def upsert_user(user_id: str, name: str, email: str, college: str = None):
        """Update or insert a user in Postgres for search synchronization."""
        print(f"📥 Inserting user: {{'id': user_id, 'name': name, 'email': email, 'college': college}}")
        if not user_id or not name or not email:
            print(f"⚠️ Missing required fields for Postgres user sync, skipping. ID: {user_id}")
            return

        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(select(User).where(User.id == user_id))
                user = result.scalars().first()
                if user:
                    print(f"🔁 Updating user: {user_id}")
                    user.name = name
                    user.email = email
                    user.college = college
                else:
                    print(f"🆕 Creating user: {user_id}")
                    new_user = User(id=user_id, name=name, email=email, college=college)
                    session.add(new_user)
                
                await session.commit()
                print(f"✅ Commit success for user {user_id}")
            except Exception as e:
                await session.rollback()
                print(f"❌ Error: {e}")
