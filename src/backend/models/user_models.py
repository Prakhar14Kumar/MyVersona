from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.sql import func
from src.backend.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    college = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Index for fast text search
Index('ix_users_name', User.name)
