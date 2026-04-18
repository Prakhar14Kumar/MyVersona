"""
Career AI Tasks - Async Celery Tasks
=====================================

Handles heavy ML processing for career-related features:
- Career recommendations
- Skill gap analysis
- Learning path generation
- Job matching
"""

from celery import Task
from typing import List, Dict, Any, Optional
import logging

from modules.ai.celery_app import celery_app
from modules.ai.models.career_recommender import CareerRecommender
from modules.ai.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

# ==================== MODEL INITIALIZATION ====================
# Initialize models once per worker (not per task)

career_recommender = None
gemini_service = None


class CareerTask(Task):
    """Base class for career tasks with model initialization"""
    
    def __init__(self):
        global career_recommender, gemini_service
        
        if career_recommender is None:
            logger.info("Initializing CareerRecommender model...")
            career_recommender = CareerRecommender()
        
        if gemini_service is None:
            logger.info("Initializing GeminiService...")
            gemini_service = GeminiService()


# ==================== CAREER RECOMMENDATION TASKS ====================

@celery_app.task(
    base=CareerTask,
    bind=True,
    name='modules.ai.tasks.career_tasks.get_career_recommendations',
    max_retries=3,
    default_retry_delay=60
)
def get_career_recommendations(
    self,
    skills: List[str],
    interests: List[str],
    education: Optional[str] = None,
    experience: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get AI-powered career recommendations
    
    Args:
        skills: List of user skills
        interests: List of user interests
        education: Education level
        experience: Years of experience
    
    Returns:
        {
            "recommendations": [...],
            "confidence_scores": {...},
            "suggested_skills": [...]
        }
    """
    try:
        logger.info(f"Processing career recommendations for skills: {skills}")
        
        recommendations = career_recommender.recommend(
            skills=skills,
            interests=interests,
            education=education,
            experience=experience
        )
        
        return {
            "success": True,
            "data": recommendations
        }
        
    except Exception as e:
        logger.error(f"Career recommendation error: {e}")
        # Retry task on failure
        raise self.retry(exc=e)


@celery_app.task(
    base=CareerTask,
    bind=True,
    name='modules.ai.tasks.career_tasks.analyze_skill_gap',
    max_retries=3
)
def analyze_skill_gap(
    self,
    current_skills: List[str],
    target_role: str
) -> Dict[str, Any]:
    """
    Analyze skill gaps for target role
    
    Args:
        current_skills: User's current skills
        target_role: Desired job role
    
    Returns:
        {
            "missing_skills": [...],
            "skill_match_percentage": 75,
            "recommended_courses": [...]
        }
    """
    try:
        logger.info(f"Analyzing skill gap for role: {target_role}")
        
        # Use Gemini AI for intelligent skill gap analysis
        analysis = gemini_service.analyze_skill_gap(
            current_skills=current_skills,
            target_role=target_role
        )
        
        return {
            "success": True,
            "data": analysis
        }
        
    except Exception as e:
        logger.error(f"Skill gap analysis error: {e}")
        raise self.retry(exc=e)


@celery_app.task(
    base=CareerTask,
    bind=True,
    name='modules.ai.tasks.career_tasks.generate_learning_path',
    max_retries=2
)
def generate_learning_path(
    self,
    current_skills: List[str],
    target_role: str,
    timeline_months: int = 6
) -> Dict[str, Any]:
    """
    Generate personalized learning path using Gemini AI
    
    Args:
        current_skills: User's current skills
        target_role: Target job role
        timeline_months: Learning timeline in months
    
    Returns:
        {
            "phases": [...],
            "total_duration": "6 months",
            "resources": [...]
        }
    """
    try:
        logger.info(f"Generating learning path for {target_role}")
        
        learning_path = gemini_service.generate_learning_path(
            current_skills=current_skills,
            target_role=target_role,
            timeline_months=timeline_months
        )
        
        return {
            "success": True,
            "data": learning_path
        }
        
    except Exception as e:
        logger.error(f"Learning path generation error: {e}")
        raise self.retry(exc=e)


@celery_app.task(
    base=CareerTask,
    bind=True,
    name='modules.ai.tasks.career_tasks.generate_interview_questions',
    max_retries=2
)
def generate_interview_questions(
    self,
    role: str,
    experience_level: str = "entry",
    question_count: int = 10
) -> Dict[str, Any]:
    """
    Generate AI-powered interview questions
    
    Args:
        role: Job role
        experience_level: entry/mid/senior
        question_count: Number of questions to generate
    
    Returns:
        {
            "questions": [...],
            "categories": {...}
        }
    """
    try:
        logger.info(f"Generating interview questions for {role}")
        
        questions = gemini_service.generate_interview_questions(
            role=role,
            experience_level=experience_level,
            question_count=question_count
        )
        
        return {
            "success": True,
            "data": questions
        }
        
    except Exception as e:
        logger.error(f"Interview questions generation error: {e}")
        raise self.retry(exc=e)


@celery_app.task(
    base=CareerTask,
    bind=True,
    name='modules.ai.tasks.career_tasks.analyze_career_trends',
    max_retries=2
)
def analyze_career_trends(
    self,
    industry: str
) -> Dict[str, Any]:
    """
    Analyze career trends in an industry
    
    Args:
        industry: Industry name (e.g., "Technology", "Healthcare")
    
    Returns:
        {
            "trending_roles": [...],
            "in_demand_skills": [...],
            "salary_trends": {...}
        }
    """
    try:
        logger.info(f"Analyzing career trends for industry: {industry}")
        
        trends = gemini_service.analyze_career_trends(industry)
        
        return {
            "success": True,
            "data": trends
        }
        
    except Exception as e:
        logger.error(f"Career trends analysis error: {e}")
        raise self.retry(exc=e)


# ==================== EXPORT ====================

__all__ = [
    'get_career_recommendations',
    'analyze_skill_gap',
    'generate_learning_path',
    'generate_interview_questions',
    'analyze_career_trends'
]
