from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

# Standardized dependencies
from dependencies.auth_dependency import get_current_user
from dependencies.billing_dependency import verify_and_deduct_credits
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

# Router setup with prefix and tags
router = APIRouter(
    prefix="/api/gemini",
    tags=["Gemini AI Features"],
    # Sequence of security middleware: First Auth, then Billing!
    dependencies=[Depends(get_current_user), Depends(verify_and_deduct_credits)]
)

# Shared DI for service
def get_gemini_service() -> GeminiService:
    # This prevents instantiating the service globally on startup
    return GeminiService()

# --- Pydantic Models for Input Validation & Sanitization ---

class ResumeEnhanceRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, max_length=15000, description="Raw text from the parsed resume.")

class LearningPathRequest(BaseModel):
    current_skills: List[str] = Field(..., max_items=50)
    target_role: str = Field(..., max_length=100)

class InterviewQuestionsRequest(BaseModel):
    role: str = Field(..., max_length=100)
    experience_level: str = Field("entry", pattern="^(entry|intermediate|senior|lead)$")

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None

# --- Endpoints ---

@router.post("/resume/enhance", response_model=APIResponse)
async def enhance_resume_with_ai(
    request: ResumeEnhanceRequest,
    req: Request, # For rate limiting context if needed
    user: dict = Depends(get_current_user),
    gemini_svc: GeminiService = Depends(get_gemini_service)
):
    """
    Enhance resume analysis with Gemini AI insights.
    🔒 PROTECTED ROUTE: Requires Firebase Bearer Token
    """
    try:
        # User ID is available for personalized logic or logging
        logger.info(f"User {user.get('uid')} requested resume enhancement.")
        
        enhancement = gemini_svc.enhance_resume(request.resume_text)
        
        return APIResponse(success=True, data=enhancement)
    except Exception as e:
        logger.error(f"Resume enhancement error for {user.get('uid')}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process resume enhancement.")

@router.post("/learning-path", response_model=APIResponse)
async def generate_learning_path(
    request: LearningPathRequest,
    user: dict = Depends(get_current_user),
    gemini_svc: GeminiService = Depends(get_gemini_service)
):
    """
    Generate personalized learning path using Gemini AI.
    🔒 PROTECTED ROUTE: Requires Firebase Bearer Token
    """
    try:
        path = gemini_svc.generate_learning_path(
            current_skills=request.current_skills,
            target_role=request.target_role
        )
        return APIResponse(success=True, data=path)
    except Exception as e:
        logger.error(f"Learning path generation error for {user.get('uid')}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate learning path.")

@router.post("/interview-questions", response_model=APIResponse)
async def get_interview_questions(
    request: InterviewQuestionsRequest,
    user: dict = Depends(get_current_user),
    gemini_svc: GeminiService = Depends(get_gemini_service)
):
    """
    Generate AI-powered interview questions for practice.
    🔒 PROTECTED ROUTE: Requires Firebase Bearer Token
    """
    try:
        questions = gemini_svc.generate_interview_questions(
            role=request.role,
            experience_level=request.experience_level
        )
        return APIResponse(success=True, data=questions)
    except Exception as e:
        logger.error(f"Interview questions error for {user.get('uid')}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate interview questions.")
