from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging

from ..core.auth.decorators import get_current_user
from ..services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/moderation", tags=["moderation"])

class ContentModerationRequest(BaseModel):
    content: str

class ContentModerationResponse(BaseModel):
    is_appropriate: bool
    reason: str = None
    category: str = None
    confidence: str = None
    flagged: bool = False

@router.post("/check", response_model=ContentModerationResponse)
async def moderate_content(
    request: ContentModerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Check content for policy violations before posting
    
    - Detects hate speech, spam, NSFW, violence, PII, fraud
    - Returns moderation decision with reason
    """
    try:
        if not request.content or len(request.content.strip()) == 0:
            return {
                "is_appropriate": False,
                "reason": "Content cannot be empty",
                "flagged": True
            }
        
        # Moderate content using AI
        moderation_result = await ai_service.moderate_content(request.content)
        
        return moderation_result
    except Exception as e:
        logger.error(f"Content moderation error: {e}")
        # Fallback: allow content but log error
        return {
            "is_appropriate": True,
            "reason": None,
            "flagged": False,
            "error": "Moderation service temporarily unavailable"
        }
