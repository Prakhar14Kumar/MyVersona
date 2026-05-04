import uuid
from sqlalchemy.future import select
from sqlalchemy import update
from src.backend.models.chat_models import Message, Conversation
from src.backend.core.database import AsyncSessionLocal

class PostgresChatService:
    @staticmethod
    async def save_message(conversation_id: str, sender_id: str, receiver_id: str, content: str, chat_type: str = "casual") -> dict:
        async with AsyncSessionLocal() as session:
            # Check if conversation exists, create if not
            result = await session.execute(select(Conversation).where(Conversation.id == conversation_id))
            conv = result.scalar_one_or_none()
            if not conv:
                new_conv = Conversation(
                    id=conversation_id, 
                    user1_id=sender_id, 
                    user2_id=receiver_id, 
                    chat_type=chat_type
                )
                session.add(new_conv)
                await session.commit()
                
            msg_id = str(uuid.uuid4())
            new_msg = Message(
                id=msg_id,
                conversation_id=conversation_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content
            )
            session.add(new_msg)
            await session.commit()
            await session.refresh(new_msg)
            
            return {
                "id": new_msg.id,
                "conversation_id": new_msg.conversation_id,
                "sender_id": new_msg.sender_id,
                "receiver_id": new_msg.receiver_id,
                "content": new_msg.content,
                "timestamp": new_msg.timestamp.isoformat(),
                "is_read": new_msg.is_read
            }

    @staticmethod
    async def get_chat_history(conversation_id: str, limit: int = 50, offset: int = 0):
        async with AsyncSessionLocal() as session:
            stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp.asc()).offset(offset).limit(limit)
            result = await session.execute(stmt)
            messages = result.scalars().all()
            return [
                {
                    "id": msg.id,
                    "sender_id": msg.sender_id,
                    "content": msg.content,
                    "timestamp": msg.timestamp.strftime("%I:%M %p"),
                    "is_read": msg.is_read
                } for msg in messages
            ]

    @staticmethod
    async def mark_as_read(conversation_id: str, receiver_id: str):
        async with AsyncSessionLocal() as session:
            stmt = update(Message).where(
                Message.conversation_id == conversation_id,
                Message.receiver_id == receiver_id,
                Message.is_read == False
            ).values(is_read=True)
            await session.execute(stmt)
            await session.commit()
