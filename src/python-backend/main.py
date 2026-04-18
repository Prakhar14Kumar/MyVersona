"""
VerSona AI Backend - FastAPI Server
==================================

A production-ready AI/ML backend for the VerSona social platform.

Tech Stack:
- FastAPI: Modern async web framework
- scikit-learn: Traditional ML algorithms
- transformers: Hugging Face models (BERT, GPT)
- spaCy: NLP and NER
- pandas: Data manipulation

Setup:
1. Install dependencies: pip install -r requirements.txt
2. Download models: python -m spacy download en_core_web_sm
3. Run server: uvicorn main:app --reload
4. API docs: http://localhost:8000/docs

Deployment:
- Railway: railway up
- Render: Connect GitHub repo
- AWS Lambda: Use Mangum adapter
- Google Cloud Run: Use Dockerfile
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import ML modules (create these in separate files)
from ml_models.career_recommender import CareerRecommender
from ml_models.content_recommender import ContentRecommender
from ml_models.resume_analyzer import ResumeAnalyzer
from ml_models.text_classifier import TextClassifier
from ml_models.college_matcher import CollegeMatcher
from ml_models.connection_recommender import ConnectionRecommender
from ml_models.gemini_service import GeminiService
from ml_models.ai_chat_mentor import AIChatMentor
from ml_models.ai_content_moderation import AIContentModerator
from ml_models.ai_feed_ranking import AIFeedRanking
from ml_models.ai_semantic_search import AISemanticSearch
from ml_models.ai_recommendations import AIRecommendationEngine
from ml_models.ai_content_tools import AIContentTools
from ml_models.ai_advanced_features import AIAdvancedFeatures

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Validate Gemini API configuration on startup
try:
    from ml_models.gemini_config import get_gemini_config
    gemini_config = get_gemini_config()
    logger.info("✅ Gemini AI configured successfully!")
except ValueError as e:
    logger.error(f"❌ Gemini AI configuration error: {e}")
    logger.error("The server will start but AI features will not work!")
    logger.error("Please configure GEMINI_API_KEY in your .env file.")
except Exception as e:
    logger.error(f"Unexpected error during Gemini initialization: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="VerSona AI Backend",
    description="ML-powered APIs for career recommendations and content personalization - 100% Gemini AI",
    version="2.0.0"
)

# Configure CORS - Update with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-versona-app.com"  # Update with your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models (singleton pattern)
career_recommender = CareerRecommender()
content_recommender = ContentRecommender()
resume_analyzer = ResumeAnalyzer()
text_classifier = TextClassifier()
college_matcher = CollegeMatcher()
connection_recommender = ConnectionRecommender()
gemini_service = GeminiService()
ai_chat_mentor = AIChatMentor()
ai_content_moderator = AIContentModerator()
ai_feed_ranking = AIFeedRanking()
ai_semantic_search = AISemanticSearch()
ai_recommendation_engine = AIRecommendationEngine()
ai_content_tools = AIContentTools()
ai_advanced_features = AIAdvancedFeatures()


# ============================================================================
# Request/Response Models (Pydantic)
# ============================================================================

class UserProfile(BaseModel):
    skills: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    education: Optional[str] = None
    experience: Optional[str] = None


class CareerRecommendationRequest(BaseModel):
    user_profile: UserProfile


class ContentRecommendationRequest(BaseModel):
    user_id: str
    feed_type: str  # 'entertainment' or 'career'


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class PostCategorizationRequest(BaseModel):
    text: str


class CollegeMatchRequest(BaseModel):
    preferences: Dict[str, Any]


class ConnectionRequest(BaseModel):
    user_id: str
    profile: Dict[str, Any]


class HashtagRequest(BaseModel):
    text: str


class ChatMessageRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]


class SkillGapRequest(BaseModel):
    current_skills: List[str]
    target_role: str


class SentimentRequest(BaseModel):
    text: str


class TrendRequest(BaseModel):
    category: str


class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: str = datetime.utcnow().isoformat()


# ============================================================================
# Health Check
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "VerSona AI Backend",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": True,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Career Recommendations API
# ============================================================================

@app.post("/api/career/recommendations", response_model=APIResponse)
async def get_career_recommendations(request: CareerRecommendationRequest):
    """
    Get AI-powered career recommendations based on user profile.
    
    Uses:
    - Collaborative filtering
    - BERT-based skill matching
    - Job market trend analysis
    """
    try:
        logger.info(f"Career recommendation request: {request.user_profile}")
        
        recommendations = career_recommender.recommend(
            skills=request.user_profile.skills,
            interests=request.user_profile.interests,
            education=request.user_profile.education,
            experience=request.user_profile.experience
        )
        
        return APIResponse(
            success=True,
            data=recommendations
        )
    except Exception as e:
        logger.error(f"Career recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Content Recommendations API
# ============================================================================

@app.post("/api/content/recommendations", response_model=APIResponse)
async def get_content_recommendations(request: ContentRecommendationRequest):
    """
    Get personalized content recommendations for user feed.
    
    Uses:
    - Hybrid recommendation (content-based + collaborative filtering)
    - User interaction history
    - College network analysis
    """
    try:
        recommendations = content_recommender.recommend(
            user_id=request.user_id,
            feed_type=request.feed_type
        )
        
        return APIResponse(
            success=True,
            data=recommendations
        )
    except Exception as e:
        logger.error(f"Content recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Resume Analysis API
# ============================================================================

@app.post("/api/resume/analyze", response_model=APIResponse)
async def analyze_resume_text(request: ResumeAnalysisRequest):
    """
    Analyze resume text and provide feedback.
    
    Uses:
    - NER (Named Entity Recognition) with spaCy
    - Skill extraction
    - ATS (Applicant Tracking System) scoring
    """
    try:
        analysis = resume_analyzer.analyze_text(request.resume_text)
        
        return APIResponse(
            success=True,
            data=analysis
        )
    except Exception as e:
        logger.error(f"Resume analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/analyze-file", response_model=APIResponse)
async def analyze_resume_file(resume: UploadFile = File(...)):
    """
    Analyze uploaded resume file (PDF/DOCX).
    """
    try:
        # Read file
        content = await resume.read()
        
        # Extract text from PDF/DOCX
        text = resume_analyzer.extract_text_from_file(content, resume.filename)
        
        # Analyze
        analysis = resume_analyzer.analyze_text(text)
        
        return APIResponse(
            success=True,
            data=analysis
        )
    except Exception as e:
        logger.error(f"Resume file analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Post Categorization API
# ============================================================================

@app.post("/api/posts/categorize", response_model=APIResponse)
async def categorize_post(request: PostCategorizationRequest):
    """
    Categorize post as entertainment or career content.
    
    Uses:
    - Fine-tuned BERT classifier
    - Keyword extraction
    """
    try:
        result = text_classifier.categorize(request.text)
        
        return APIResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"Post categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# College Matching API
# ============================================================================

@app.post("/api/colleges/match", response_model=APIResponse)
async def match_colleges(request: CollegeMatchRequest):
    """
    Match colleges based on student preferences.
    
    Uses:
    - Multi-criteria decision making
    - Cosine similarity
    """
    try:
        matches = college_matcher.find_matches(request.preferences)
        
        return APIResponse(
            success=True,
            data=matches
        )
    except Exception as e:
        logger.error(f"College matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Connection Recommendations API
# ============================================================================

@app.post("/api/connections/recommendations", response_model=APIResponse)
async def recommend_connections(request: ConnectionRequest):
    """
    Recommend connections based on user profile and network.
    
    Uses:
    - Graph Neural Network
    - Collaborative filtering
    """
    try:
        recommendations = connection_recommender.recommend(
            user_id=request.user_id,
            profile=request.profile
        )
        
        return APIResponse(
            success=True,
            data=recommendations
        )
    except Exception as e:
        logger.error(f"Connection recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Hashtag Suggestions API
# ============================================================================

@app.post("/api/hashtags/suggest", response_model=APIResponse)
async def suggest_hashtags(request: HashtagRequest):
    """
    Suggest relevant hashtags for a post.
    
    Uses:
    - TF-IDF
    - Trend analysis
    """
    try:
        suggestions = text_classifier.suggest_hashtags(request.text)
        
        return APIResponse(
            success=True,
            data=suggestions
        )
    except Exception as e:
        logger.error(f"Hashtag suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI Chat Assistant API
# ============================================================================

@app.post("/api/chat/message", response_model=APIResponse)
async def chat_message(request: ChatMessageRequest):
    """
    AI Career Assistant chat endpoint powered by Google Gemini.
    
    Uses:
    - Google Gemini Pro for intelligent career counseling
    - Context-aware responses based on chat history
    """
    try:
        # Use Gemini AI for career counseling
        response = gemini_service.chat_career_assistant(
            message=request.message,
            chat_history=request.history
        )
        
        return APIResponse(
            success=True,
            data=response
        )
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Skill Gap Analysis API
# ============================================================================

@app.post("/api/skills/gap-analysis", response_model=APIResponse)
async def analyze_skill_gap(request: SkillGapRequest):
    """
    Analyze skill gaps for a target role.
    """
    try:
        # TODO: Implement skill gap analysis
        analysis = {
            "missing_skills": ["Python", "Machine Learning", "Docker"],
            "recommended_courses": [
                {
                    "title": "Python for Everybody",
                    "platform": "Coursera",
                    "url": "https://coursera.org/learn/python"
                }
            ],
            "skill_match_percentage": 65
        }
        
        return APIResponse(
            success=True,
            data=analysis
        )
    except Exception as e:
        logger.error(f"Skill gap analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Sentiment Analysis API
# ============================================================================

@app.post("/api/sentiment/analyze", response_model=APIResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of text.
    
    Uses:
    - BERT-based sentiment classifier
    """
    try:
        result = text_classifier.analyze_sentiment(request.text)
        
        return APIResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Trend Prediction API
# ============================================================================

@app.post("/api/trends/predict", response_model=APIResponse)
async def predict_trends(request: TrendRequest):
    """
    Predict trending topics.
    
    Uses:
    - Time series forecasting
    - Trend analysis
    """
    try:
        # TODO: Implement trend prediction
        trends = [
            {
                "topic": "AI/ML Careers",
                "predicted_growth": 0.85,
                "current_volume": 1250
            },
            {
                "topic": "Remote Internships",
                "predicted_growth": 0.72,
                "current_volume": 890
            }
        ]
        
        return APIResponse(
            success=True,
            data=trends
        )
    except Exception as e:
        logger.error(f"Trend prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Gemini AI Enhanced Endpoints
# ============================================================================

class ResumeEnhanceRequest(BaseModel):
    resume_text: str


class LearningPathRequest(BaseModel):
    current_skills: List[str]
    target_role: str


class InterviewQuestionsRequest(BaseModel):
    role: str
    experience_level: str = "entry"


class PostImprovementRequest(BaseModel):
    post_text: str
    post_type: str = "career"


class CareerTrendsRequest(BaseModel):
    industry: str


@app.post("/api/gemini/resume/enhance", response_model=APIResponse)
async def enhance_resume_with_ai(request: ResumeEnhanceRequest):
    """
    Enhance resume analysis with Gemini AI insights.
    
    Provides:
    - Detailed AI-powered feedback
    - ATS optimization tips
    - Formatting suggestions
    """
    try:
        enhancement = gemini_service.enhance_resume(request.resume_text)
        
        return APIResponse(
            success=True,
            data=enhancement
        )
    except Exception as e:
        logger.error(f"Resume enhancement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gemini/learning-path", response_model=APIResponse)
async def generate_learning_path(request: LearningPathRequest):
    """
    Generate personalized learning path using Gemini AI.
    
    Creates:
    - Structured learning timeline
    - Phase-wise curriculum
    - Recommended resources
    - Project ideas
    """
    try:
        path = gemini_service.generate_learning_path(
            current_skills=request.current_skills,
            target_role=request.target_role
        )
        
        return APIResponse(
            success=True,
            data=path
        )
    except Exception as e:
        logger.error(f"Learning path generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gemini/interview-questions", response_model=APIResponse)
async def get_interview_questions(request: InterviewQuestionsRequest):
    """
    Generate AI-powered interview questions for practice.
    
    Features:
    - Role-specific questions
    - Mix of technical and behavioral
    - Difficulty levels
    - Answer hints
    """
    try:
        questions = gemini_service.generate_interview_questions(
            role=request.role,
            experience_level=request.experience_level
        )
        
        return APIResponse(
            success=True,
            data=questions
        )
    except Exception as e:
        logger.error(f"Interview questions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gemini/post/improve", response_model=APIResponse)
async def improve_post(request: PostImprovementRequest):
    """
    Improve post content with AI suggestions.
    
    Provides:
    - Enhanced post text
    - Engagement tips
    - Hashtag suggestions
    """
    try:
        improvement = gemini_service.improve_post_content(
            post_text=request.post_text,
            post_type=request.post_type
        )
        
        return APIResponse(
            success=True,
            data=improvement
        )
    except Exception as e:
        logger.error(f"Post improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gemini/trends/analyze", response_model=APIResponse)
async def analyze_industry_trends(request: CareerTrendsRequest):
    """
    Analyze career trends in an industry using AI.
    
    Provides:
    - Trending roles
    - In-demand skills
    - Salary trends
    - Future outlook
    """
    try:
        trends = gemini_service.analyze_career_trends(request.industry)
        
        return APIResponse(
            success=True,
            data=trends
        )
    except Exception as e:
        logger.error(f"Trend analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI Chat Mentor Endpoints
# ============================================================================

class CareerGuidanceRequest(BaseModel):
    message: str
    user_profile: Optional[Dict[str, Any]] = None
    chat_history: Optional[List[Dict[str, str]]] = None

class ResumeImprovementRequest(BaseModel):
    resume_text: str

class InterviewPrepRequest(BaseModel):
    role: str
    experience_level: str = "entry"
    company_type: str = "startup"

class SkillRoadmapRequest(BaseModel):
    current_skills: List[str]
    target_role: str
    timeline_months: int = 6

class ProjectSuggestionRequest(BaseModel):
    skills: List[str]
    difficulty: str = "intermediate"
    domain: Optional[str] = None

@app.post("/api/ai-mentor/career-guidance", response_model=APIResponse)
async def get_career_guidance(request: CareerGuidanceRequest):
    """AI Chat Mentor - Career guidance through conversational AI."""
    try:
        response = ai_chat_mentor.chat_career_guidance(
            message=request.message,
            user_profile=request.user_profile,
            chat_history=request.chat_history
        )
        return APIResponse(success=True, data=response)
    except Exception as e:
        logger.error(f"Career guidance error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-mentor/resume-tips", response_model=APIResponse)
async def get_resume_tips(request: ResumeImprovementRequest):
    """Get AI-powered resume improvement tips."""
    try:
        tips = ai_chat_mentor.get_resume_improvement_tips(request.resume_text)
        return APIResponse(success=True, data=tips)
    except Exception as e:
        logger.error(f"Resume tips error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-mentor/interview-prep", response_model=APIResponse)
async def get_interview_prep(request: InterviewPrepRequest):
    """Generate personalized interview preparation material."""
    try:
        prep = ai_chat_mentor.generate_interview_prep(
            role=request.role,
            experience_level=request.experience_level,
            company_type=request.company_type
        )
        return APIResponse(success=True, data=prep)
    except Exception as e:
        logger.error(f"Interview prep error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-mentor/skill-roadmap", response_model=APIResponse)
async def create_skill_roadmap(request: SkillRoadmapRequest):
    """Create personalized learning roadmap."""
    try:
        roadmap = ai_chat_mentor.create_skill_roadmap(
            current_skills=request.current_skills,
            target_role=request.target_role,
            timeline_months=request.timeline_months
        )
        return APIResponse(success=True, data=roadmap)
    except Exception as e:
        logger.error(f"Skill roadmap error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-mentor/project-suggestions", response_model=APIResponse)
async def suggest_projects(request: ProjectSuggestionRequest):
    """Suggest relevant projects to build portfolio."""
    try:
        suggestions = ai_chat_mentor.suggest_projects(
            skills=request.skills,
            difficulty=request.difficulty,
            domain=request.domain
        )
        return APIResponse(success=True, data=suggestions)
    except Exception as e:
        logger.error(f"Project suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Content Moderation Endpoints
# ============================================================================

class ContentModerationRequest(BaseModel):
    content: str
    content_type: str = "post"
    user_history: Optional[Dict[str, Any]] = None

class ChatModerationRequest(BaseModel):
    message: str
    sender_id: str
    recipient_id: str

@app.post("/api/moderation/content", response_model=APIResponse)
async def moderate_content(request: ContentModerationRequest):
    """Moderate content for policy violations."""
    try:
        result = ai_content_moderator.moderate_content(
            content=request.content,
            content_type=request.content_type,
            user_history=request.user_history
        )
        return APIResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Content moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/moderation/chat", response_model=APIResponse)
async def moderate_chat(request: ChatModerationRequest):
    """Real-time chat message moderation."""
    try:
        result = ai_content_moderator.moderate_chat_message(
            message=request.message,
            sender_id=request.sender_id,
            recipient_id=request.recipient_id
        )
        return APIResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Chat moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/moderation/toxicity-score", response_model=APIResponse)
async def get_toxicity_score(request: SentimentRequest):
    """Get toxicity score for text."""
    try:
        score = ai_content_moderator.get_toxicity_score(request.text)
        return APIResponse(success=True, data={"toxicity_score": score})
    except Exception as e:
        logger.error(f"Toxicity score error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Feed Ranking Endpoints
# ============================================================================

class FeedRankingRequest(BaseModel):
    user_id: str
    posts: List[Dict[str, Any]]
    feed_type: str = "entertainment"
    user_profile: Optional[Dict[str, Any]] = None
    user_interactions: Optional[List[Dict[str, Any]]] = None

class ViralityScoreRequest(BaseModel):
    post: Dict[str, Any]

@app.post("/api/feed/rank", response_model=APIResponse)
async def rank_feed(request: FeedRankingRequest):
    """Rank feed posts for personalized experience."""
    try:
        ranked_posts = ai_feed_ranking.rank_feed(
            user_id=request.user_id,
            posts=request.posts,
            feed_type=request.feed_type,
            user_profile=request.user_profile,
            user_interactions=request.user_interactions
        )
        return APIResponse(success=True, data=ranked_posts)
    except Exception as e:
        logger.error(f"Feed ranking error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/feed/trending-topics", response_model=APIResponse)
async def get_trending_topics(feed_type: str = "all", limit: int = 10):
    """Get currently trending topics/hashtags."""
    try:
        trending = ai_feed_ranking.get_trending_topics(
            feed_type=feed_type,
            limit=limit
        )
        return APIResponse(success=True, data=trending)
    except Exception as e:
        logger.error(f"Trending topics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feed/virality-score", response_model=APIResponse)
async def calculate_virality(request: ViralityScoreRequest):
    """Calculate virality potential of a post."""
    try:
        score = ai_feed_ranking.calculate_virality_score(request.post)
        return APIResponse(success=True, data=score)
    except Exception as e:
        logger.error(f"Virality score error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Semantic Search Endpoints
# ============================================================================

class SearchRequest(BaseModel):
    query: str
    search_type: str = "all"
    user_context: Optional[Dict[str, Any]] = None
    limit: int = 20

class AutocompleteRequest(BaseModel):
    partial_query: str
    search_type: str = "all"
    limit: int = 10

@app.post("/api/search", response_model=APIResponse)
async def semantic_search(request: SearchRequest):
    """Perform semantic search across platform content."""
    try:
        results = ai_semantic_search.search(
            query=request.query,
            search_type=request.search_type,
            user_context=request.user_context,
            limit=request.limit
        )
        return APIResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search/autocomplete", response_model=APIResponse)
async def search_autocomplete(request: AutocompleteRequest):
    """Provide autocomplete suggestions."""
    try:
        suggestions = ai_semantic_search.autocomplete(
            partial_query=request.partial_query,
            search_type=request.search_type,
            limit=request.limit
        )
        return APIResponse(success=True, data=suggestions)
    except Exception as e:
        logger.error(f"Autocomplete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/trending", response_model=APIResponse)
async def get_trending_searches(limit: int = 10):
    """Get trending search queries."""
    try:
        trending = ai_semantic_search.get_trending_searches(limit=limit)
        return APIResponse(success=True, data=trending)
    except Exception as e:
        logger.error(f"Trending searches error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI Recommendations Endpoints
# ============================================================================

class CreatorRecommendationRequest(BaseModel):
    user_id: str
    user_profile: Dict[str, Any]
    user_interactions: Optional[List[Dict[str, Any]]] = None
    limit: int = 10

class SkillRecommendationRequest(BaseModel):
    user_profile: Dict[str, Any]
    career_goal: Optional[str] = None
    limit: int = 10

class InternshipRecommendationRequest(BaseModel):
    user_profile: Dict[str, Any]
    preferences: Optional[Dict[str, Any]] = None
    limit: int = 10

class CommunityRecommendationRequest(BaseModel):
    user_profile: Dict[str, Any]
    limit: int = 10

class HashtagRecommendationRequest(BaseModel):
    content: str
    content_type: str = "post"
    user_profile: Optional[Dict[str, Any]] = None
    limit: int = 10

@app.post("/api/recommendations/creators", response_model=APIResponse)
async def recommend_creators(request: CreatorRecommendationRequest):
    """Recommend creators/users to follow."""
    try:
        recommendations = ai_recommendation_engine.recommend_creators(
            user_id=request.user_id,
            user_profile=request.user_profile,
            user_interactions=request.user_interactions,
            limit=request.limit
        )
        return APIResponse(success=True, data=recommendations)
    except Exception as e:
        logger.error(f"Creator recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/skills", response_model=APIResponse)
async def recommend_skills(request: SkillRecommendationRequest):
    """Recommend skills to learn."""
    try:
        recommendations = ai_recommendation_engine.recommend_skills(
            user_profile=request.user_profile,
            career_goal=request.career_goal,
            limit=request.limit
        )
        return APIResponse(success=True, data=recommendations)
    except Exception as e:
        logger.error(f"Skill recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/internships", response_model=APIResponse)
async def recommend_internships(request: InternshipRecommendationRequest):
    """Recommend relevant internships."""
    try:
        recommendations = ai_recommendation_engine.recommend_internships(
            user_profile=request.user_profile,
            preferences=request.preferences,
            limit=request.limit
        )
        return APIResponse(success=True, data=recommendations)
    except Exception as e:
        logger.error(f"Internship recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/communities", response_model=APIResponse)
async def recommend_communities(request: CommunityRecommendationRequest):
    """Recommend communities/groups to join."""
    try:
        recommendations = ai_recommendation_engine.recommend_communities(
            user_profile=request.user_profile,
            limit=request.limit
        )
        return APIResponse(success=True, data=recommendations)
    except Exception as e:
        logger.error(f"Community recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/hashtags", response_model=APIResponse)
async def recommend_hashtags_ai(request: HashtagRecommendationRequest):
    """Recommend hashtags for content."""
    try:
        recommendations = ai_recommendation_engine.recommend_hashtags(
            content=request.content,
            content_type=request.content_type,
            user_profile=request.user_profile,
            limit=request.limit
        )
        return APIResponse(success=True, data=recommendations)
    except Exception as e:
        logger.error(f"Hashtag recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Content Creation Tools Endpoints
# ============================================================================

class CaptionGenerationRequest(BaseModel):
    image_description: Optional[str] = None
    content_type: str = "post"
    tone: str = "casual"
    context: Optional[Dict[str, Any]] = None

class HashtagGenerationRequest(BaseModel):
    content: str
    category: str = "general"
    count: int = 10

class MemeIdeaRequest(BaseModel):
    topic: str
    style: str = "relatable"
    target_audience: str = "college students"

class ThumbnailSuggestionRequest(BaseModel):
    video_description: str
    video_type: str = "educational"

class TextImprovementRequest(BaseModel):
    text: str
    improvement_type: str = "engagement"

class ContentIdeasRequest(BaseModel):
    user_profile: Dict[str, Any]
    content_type: str = "post"
    count: int = 5

@app.post("/api/content-tools/generate-caption", response_model=APIResponse)
async def generate_caption(request: CaptionGenerationRequest):
    """Generate engaging captions for posts."""
    try:
        caption = ai_content_tools.generate_caption(
            image_description=request.image_description,
            content_type=request.content_type,
            tone=request.tone,
            context=request.context
        )
        return APIResponse(success=True, data=caption)
    except Exception as e:
        logger.error(f"Caption generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-tools/generate-hashtags", response_model=APIResponse)
async def generate_hashtags(request: HashtagGenerationRequest):
    """Generate relevant hashtags for content."""
    try:
        hashtags = ai_content_tools.generate_hashtags(
            content=request.content,
            category=request.category,
            count=request.count
        )
        return APIResponse(success=True, data=hashtags)
    except Exception as e:
        logger.error(f"Hashtag generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-tools/meme-ideas", response_model=APIResponse)
async def suggest_meme_ideas(request: MemeIdeaRequest):
    """Suggest meme ideas and formats."""
    try:
        ideas = ai_content_tools.suggest_meme_ideas(
            topic=request.topic,
            style=request.style,
            target_audience=request.target_audience
        )
        return APIResponse(success=True, data=ideas)
    except Exception as e:
        logger.error(f"Meme ideas error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-tools/thumbnail-suggestions", response_model=APIResponse)
async def suggest_thumbnail_style(request: ThumbnailSuggestionRequest):
    """Suggest thumbnail design ideas."""
    try:
        suggestions = ai_content_tools.suggest_thumbnail_style(
            video_description=request.video_description,
            video_type=request.video_type
        )
        return APIResponse(success=True, data=suggestions)
    except Exception as e:
        logger.error(f"Thumbnail suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-tools/improve-text", response_model=APIResponse)
async def improve_post_text(request: TextImprovementRequest):
    """Improve post text for better engagement."""
    try:
        improved = ai_content_tools.improve_post_text(
            text=request.text,
            improvement_type=request.improvement_type
        )
        return APIResponse(success=True, data=improved)
    except Exception as e:
        logger.error(f"Text improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-tools/content-ideas", response_model=APIResponse)
async def generate_content_ideas(request: ContentIdeasRequest):
    """Generate content ideas based on user profile."""
    try:
        ideas = ai_content_tools.generate_content_ideas(
            user_profile=request.user_profile,
            content_type=request.content_type,
            count=request.count
        )
        return APIResponse(success=True, data=ideas)
    except Exception as e:
        logger.error(f"Content ideas error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Advanced Features Endpoints
# ============================================================================

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

class SummarizationRequest(BaseModel):
    text: str
    summary_type: str = "brief"
    max_length: int = 150

class ProfileScoringRequest(BaseModel):
    profile: Dict[str, Any]
    profile_type: str = "student"

class CollegeMatchingRequest(BaseModel):
    user_preferences: Dict[str, Any]
    available_options: List[Dict[str, Any]]

class TrendPredictionRequest(BaseModel):
    category: str = "all"
    timeframe_days: int = 7

class LanguageDetectionRequest(BaseModel):
    text: str

class CommunityModerationRequest(BaseModel):
    community_id: str
    recent_posts: List[Dict[str, Any]]
    community_rules: List[str]

@app.post("/api/translate", response_model=APIResponse)
async def translate_content(request: TranslationRequest):
    """Translate content to Indian languages."""
    try:
        translation = ai_advanced_features.translate_content(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language
        )
        return APIResponse(success=True, data=translation)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summarize", response_model=APIResponse)
async def summarize_content(request: SummarizationRequest):
    """Summarize long posts or announcements."""
    try:
        summary = ai_advanced_features.summarize_content(
            text=request.text,
            summary_type=request.summary_type,
            max_length=request.max_length
        )
        return APIResponse(success=True, data=summary)
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile/score", response_model=APIResponse)
async def score_profile(request: ProfileScoringRequest):
    """Analyze and score user profile."""
    try:
        score = ai_advanced_features.score_profile(
            profile=request.profile,
            profile_type=request.profile_type
        )
        return APIResponse(success=True, data=score)
    except Exception as e:
        logger.error(f"Profile scoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-college-interests", response_model=APIResponse)
async def match_college_interests(request: CollegeMatchingRequest):
    """Match users to colleges, departments, communities."""
    try:
        matches = ai_advanced_features.match_college_interests(
            user_preferences=request.user_preferences,
            available_options=request.available_options
        )
        return APIResponse(success=True, data=matches)
    except Exception as e:
        logger.error(f"College matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-trends", response_model=APIResponse)
async def predict_trends_ai(request: TrendPredictionRequest):
    """Predict trending topics for memes, creators, career updates."""
    try:
        predictions = ai_advanced_features.predict_trends(
            category=request.category,
            timeframe_days=request.timeframe_days
        )
        return APIResponse(success=True, data=predictions)
    except Exception as e:
        logger.error(f"Trend prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-language", response_model=APIResponse)
async def detect_language(request: LanguageDetectionRequest):
    """Detect language of text."""
    try:
        detection = ai_advanced_features.detect_language(request.text)
        return APIResponse(success=True, data=detection)
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/community/auto-moderate", response_model=APIResponse)
async def auto_moderate_community(request: CommunityModerationRequest):
    """AI community management - auto-approvals and spam detection."""
    try:
        decisions = ai_advanced_features.auto_moderate_community(
            community_id=request.community_id,
            recent_posts=request.recent_posts,
            community_rules=request.community_rules
        )
        return APIResponse(success=True, data=decisions)
    except Exception as e:
        logger.error(f"Community moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)