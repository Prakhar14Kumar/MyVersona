from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.sql import func
from src.backend.core.database import Base

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, index=True)
    user1_id = Column(String, nullable=False)
    user2_id = Column(String, nullable=False)
    chat_type = Column(String, default="casual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, nullable=False)
    receiver_id = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)

# Add composite index for fast querying
Index('ix_messages_conversation_time', Message.conversation_id, Message.timestamp)
