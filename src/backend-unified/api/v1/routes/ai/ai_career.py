"""
AI Career Routes - Career Recommendations and Analysis
=======================================================

Routes:
- POST /api/v1/ai/career/recommendations
- POST /api/v1/ai/career/skill-gap
- POST /api/v1/ai/career/learning-path
- POST /api/v1/ai/career/interview-questions
- POST /api/v1/ai/career/trends
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from modules.ai.tasks.career_tasks import (
    get_career_recommendations,
    analyze_skill_gap,
    generate_learning_path,
    generate_interview_questions,
    analyze_career_trends
)
from core.auth.decorators import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== REQUEST/RESPONSE MODELS ====================

class CareerRecommendationRequest(BaseModel):
    skills: List[str]
    interests: List[str]
    education: Optional[str] = None
    experience: Optional[str] = None


class SkillGapRequest(BaseModel):
    current_skills: List[str]
    target_role: str


class LearningPathRequest(BaseModel):
    current_skills: List[str]
    target_role: str
    timeline_months: int = 6


class InterviewQuestionsRequest(BaseModel):
    role: str
    experience_level: str = "entry"  # entry, mid, senior
    question_count: int = 10


class CareerTrendsRequest(BaseModel):
    industry: str


class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


# ==================== ROUTES ====================

@router.post("/career/recommendations", response_model=TaskResponse)
async def career_recommendations(
    request: CareerRecommendationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get AI-powered career recommendations
    
    This is an async task - returns task_id immediately.
    Poll /api/v1/tasks/{task_id} for results.
    
    Example:
        {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "interests": ["Web Development", "AI"],
            "education": "Bachelor's in Computer Science",
            "experience": "2 years"
        }
    """
    try:
        # Submit task to Celery
        task = get_career_recommendations.delay(
            skills=request.skills,
            interests=request.interests,
            education=request.education,
            experience=request.experience
        )
        
        logger.info(f"Career recommendation task created: {task.id} for user: {current_user.get('uid')}")
        
        return TaskResponse(
            task_id=task.id,
            status="processing",
            message="Career recommendations are being generated. Poll /api/v1/tasks/{task_id} for results."
        )
        
    except Exception as e:
        logger.error(f"Career recommendations error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process career recommendations")


@router.post("/career/skill-gap", response_model=TaskResponse)
async def skill_gap_analysis(
    request: SkillGapRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Analyze skill gaps for a target role
    
    Returns:
        - Missing skills
        - Skill match percentage
        - Recommended courses
    """
    try:
        task = analyze_skill_gap.delay(
            current_skills=request.current_skills,
            target_role=request.target_role
        )
        
        return TaskResponse(
            task_id=task.id,
            status="processing",
            message="Skill gap analysis in progress"
        )
        
    except Exception as e:
        logger.error(f"Skill gap analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze skill gap")


@router.post("/career/learning-path", response_model=TaskResponse)
async def create_learning_path(
    request: LearningPathRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Generate personalized learning path using Gemini AI
    
    Creates structured timeline with:
    - Learning phases
    - Recommended resources
    - Project ideas
    - Skill milestones
    """
    try:
        task = generate_learning_path.delay(
            current_skills=request.current_skills,
            target_role=request.target_role,
            timeline_months=request.timeline_months
        )
        
        return TaskResponse(
            task_id=task.id,
            status="processing",
            message="Learning path is being generated"
        )
        
    except Exception as e:
        logger.error(f"Learning path error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate learning path")


@router.post("/career/interview-questions", response_model=TaskResponse)
async def get_interview_questions(
    request: InterviewQuestionsRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Generate AI-powered interview questions for practice
    
    Features:
    - Role-specific questions
    - Mix of technical and behavioral
    - Difficulty levels
    - Answer hints
    """
    try:
        task = generate_interview_questions.delay(
            role=request.role,
            experience_level=request.experience_level,
            question_count=request.question_count
        )
        
        return TaskResponse(
            task_id=task.id,
            status="processing",
            message="Interview questions are being generated"
        )
        
    except Exception as e:
        logger.error(f"Interview questions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate interview questions")


@router.post("/career/trends", response_model=TaskResponse)
async def industry_trends(
    request: CareerTrendsRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Analyze career trends in an industry using AI
    
    Provides:
    - Trending roles
    - In-demand skills
    - Salary trends
    - Future outlook
    """
    try:
        task = analyze_career_trends.delay(
            industry=request.industry
        )
        
        return TaskResponse(
            task_id=task.id,
            status="processing",
            message="Career trends analysis in progress"
        )
        
    except Exception as e:
        logger.error(f"Career trends error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze career trends")


# ==================== EXPORT ====================

__all__ = ['router']
