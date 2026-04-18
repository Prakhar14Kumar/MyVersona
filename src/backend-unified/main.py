"""
VerSona Unified Backend - Main Application
===========================================

Monolithic-Modular Architecture:
- All routes in single FastAPI instance
- AI/ML models as separate module with Celery queue
- Shared Firebase, Auth, Database services
- Production-ready with rate limiting, CORS, monitoring

Tech Stack:
- FastAPI + Uvicorn
- Firebase Admin SDK
- Celery + Redis (for async ML tasks)
- WebSockets (real-time features)

Usage:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

# Core imports
from core.config import settings, initialize_firebase
from core.middleware import add_middlewares
from core.exceptions import setup_exception_handlers

# Route imports - General API
from api.v1.routes import auth, posts, users, chat, notifications, search, moderation

# Route imports - AI/ML API
from api.v1.routes import (
    ai_career,
    ai_content,
    ai_resume,
    ai_mentor,
    ai_moderation,
    ai_feed,
    ai_search,
    ai_recommendations,
    ai_advanced
)

# WebSocket handlers
from core.websocket.chat_handler import chat_handler
from core.websocket.notification_handler import notification_handler
from core.websocket.presence_handler import presence_handler
from core.websocket.connection_manager import manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== INITIALIZE FASTAPI APP ====================

app = FastAPI(
    title="VerSona Unified Backend",
    description="Youth-focused Indian-first social and professional networking platform - Complete API",
    version="2.0.0",
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# ==================== MIDDLEWARE ====================

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,
)

# Add custom middlewares (rate limiting, request logging, etc.)
add_middlewares(app)

# ==================== EXCEPTION HANDLERS ====================

setup_exception_handlers(app)

# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting VerSona Unified Backend...")
    
    # Initialize Firebase Admin SDK (shared globally)
    firebase_initialized = initialize_firebase()
    if firebase_initialized:
        logger.info("✅ Firebase Admin SDK initialized")
    else:
        logger.warning("⚠️  Firebase not initialized - some features may not work")
    
    # Initialize Celery workers (AI/ML tasks)
    try:
        from modules.ai.celery_app import celery_app
        logger.info("✅ Celery task queue initialized")
        logger.info(f"   - Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        logger.info("   - Workers: Start with: celery -A modules.ai.celery_app worker --loglevel=info")
    except Exception as e:
        logger.warning(f"⚠️  Celery initialization warning: {e}")
    
    logger.info(f"✅ Server running on http://{settings.HOST}:{settings.PORT}")
    logger.info(f"📚 API docs: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info(f"🔒 CORS configured for: {', '.join(settings.ALLOWED_ORIGINS)}")
    logger.info("✅ Rate limiting enabled")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down VerSona Unified Backend...")
    
    # Close WebSocket connections
    await manager.disconnect_all()
    logger.info("✅ WebSocket connections closed")


# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "status": "running",
        "architecture": "monolithic-modular",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check Redis connection
    redis_status = "connected"
    try:
        from core.cache import redis_client
        await redis_client.ping()
    except:
        redis_status = "disconnected"
    
    # Check Celery workers
    celery_status = "unknown"
    try:
        from modules.ai.celery_app import celery_app
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        celery_status = "running" if active_workers else "no_workers"
    except:
        celery_status = "not_available"
    
    return {
        "status": "healthy",
        "firebase": "connected",
        "redis": redis_status,
        "celery_workers": celery_status,
        "rate_limiting": "enabled",
        "websockets": f"{manager.get_active_connections_count()} active"
    }


@app.get("/api/info")
async def api_info():
    """API information and available endpoints"""
    return {
        "api_version": "v1",
        "modules": {
            "general": [
                "auth", "posts", "users", "chat", 
                "notifications", "search", "moderation"
            ],
            "ai_ml": [
                "career", "content", "resume", "mentor",
                "moderation", "feed_ranking", "semantic_search",
                "recommendations", "advanced_features"
            ]
        },
        "websockets": [
            "/ws/chat/{user_id}",
            "/ws/notifications/{user_id}",
            "/ws/presence/{user_id}"
        ],
        "task_queue": "celery + redis",
        "documentation": "/docs"
    }


# ==================== INCLUDE ROUTERS ====================

# General API Routes (v1)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["Auth"])
app.include_router(posts.router, prefix=settings.API_V1_PREFIX, tags=["Posts"])
app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["Users"])
app.include_router(chat.router, prefix=settings.API_V1_PREFIX, tags=["Chat"])
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX, tags=["Notifications"])
app.include_router(search.router, prefix=settings.API_V1_PREFIX, tags=["Search"])
app.include_router(moderation.router, prefix=settings.API_V1_PREFIX, tags=["Moderation"])

# AI/ML API Routes (v1)
app.include_router(ai_career.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Career"])
app.include_router(ai_content.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Content"])
app.include_router(ai_resume.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Resume"])
app.include_router(ai_mentor.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Mentor"])
app.include_router(ai_moderation.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Moderation"])
app.include_router(ai_feed.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Feed Ranking"])
app.include_router(ai_search.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Semantic Search"])
app.include_router(ai_recommendations.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Recommendations"])
app.include_router(ai_advanced.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI - Advanced"])


# ==================== WEBSOCKET ENDPOINTS ====================

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    try:
        await chat_handler.handle_connection(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket chat error: {e}")


@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications"""
    try:
        await notification_handler.handle_connection(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket notifications error: {e}")


@app.websocket("/ws/presence/{user_id}")
async def websocket_presence(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for user presence and online status"""
    try:
        await presence_handler.handle_connection(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket presence error: {e}")


@app.get(f"{settings.API_V1_PREFIX}/ws/stats")
async def websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "total_connections": manager.get_active_connections_count(),
        "online_users": len(manager.get_online_users()),
        "active_conversations": len(manager.conversation_participants)
    }


# ==================== CELERY TASK STATUS ====================

@app.get(f"{settings.API_V1_PREFIX}/tasks/{{task_id}}")
async def get_task_status(task_id: str):
    """Get status of async Celery task"""
    try:
        from modules.ai.celery_app import celery_app
        from celery.result import AsyncResult
        
        task = AsyncResult(task_id, app=celery_app)
        
        if task.state == 'PENDING':
            response = {
                'state': task.state,
                'status': 'Task is waiting in queue...'
            }
        elif task.state == 'STARTED':
            response = {
                'state': task.state,
                'status': 'Task is being processed...'
            }
        elif task.state == 'SUCCESS':
            response = {
                'state': task.state,
                'status': 'Task completed successfully',
                'result': task.result
            }
        elif task.state == 'FAILURE':
            response = {
                'state': task.state,
                'status': 'Task failed',
                'error': str(task.info)
            }
        else:
            response = {
                'state': task.state,
                'status': str(task.info)
            }
        
        return response
    except Exception as e:
        logger.error(f"Task status error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to retrieve task status"}
        )


# ==================== RUN SERVER ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )
