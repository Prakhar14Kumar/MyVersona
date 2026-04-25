from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from src.backend.config import settings, initialize_firebase

# Initialize Firebase before importing routes
firebase_initialized = initialize_firebase()

from src.backend.routes import (
    posts,
    users,
    chat,
    notifications,
    search,
    moderation,
    explore,
    career
)

from src.backend.websocket.chat_handler import chat_handler
from src.backend.websocket.notification_handler import notification_handler
from src.backend.websocket.presence_handler import presence_handler
from src.backend.websocket.connection_manager import manager

from src.backend.core.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="VerSona Backend API - Youth-focused Indian-first social and professional networking platform",
    version="1.0.0",
    debug=settings.DEBUG
)

# ==================== CORS MIDDLEWARE ====================
# Production-safe CORS configuration
allowed_origins = settings.ALLOWED_ORIGINS

# Restrict CORS to specific domains (no wildcard in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific domains only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# ==================== RATE LIMITING MIDDLEWARE ====================
# Add rate limiting (applied after CORS)
app.add_middleware(RateLimitMiddleware)

# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting VerSona Backend...")
    
    # Firebase is already initialized at the top of the file
    if firebase_initialized:
        logger.info("✅ Firebase initialized")
    else:
        logger.warning("⚠️  Firebase not initialized - some features may not work")
    
    logger.info(f"✅ Server running on http://{settings.HOST}:{settings.PORT}")
    logger.info(f"📚 API docs available at http://{settings.HOST}:{settings.PORT}/docs")
    logger.info("✅ Rate limiting enabled")
    logger.info(f"🔒 CORS configured for: {', '.join(allowed_origins)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down VerSona Backend...")

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and frontend probing"""
    return {
        "status": "healthy",
        "firebase": "connected" if firebase_initialized else "unavailable",
        "rate_limiting": "enabled",
        "api_version": "v1",
        "api_prefix": settings.API_V1_PREFIX,
    }

@app.get("/ready")
async def readiness_check():
    """Lightweight readiness probe for frontend to detect backend availability"""
    return {"ready": True}

# ==================== API ROUTES ====================

# Include routers with versioned API prefix
app.include_router(posts.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(moderation.router, prefix=settings.API_V1_PREFIX)
app.include_router(explore.router, prefix=settings.API_V1_PREFIX)
app.include_router(career.router, prefix=settings.API_V1_PREFIX)

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

@app.get("/api/v1/ws/stats")
async def websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "total_connections": manager.get_active_connections_count(),
        "online_users": len(manager.get_online_users()),
        "active_conversations": len(manager.conversation_participants)
    }

# ==================== GLOBAL EXCEPTION HANDLER ====================

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler - never expose internal errors"""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error. Please try again later.",
            "type": "server_error"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Handle validation errors from Pydantic clearly"""
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Invalid payload parameters.",
            "details": exc.errors(),
            "type": "validation_error"
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    """Handle standard HTTP exceptions with structured response"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "type": "http_error",
            "status_code": exc.status_code
        }
    )

# ==================== RUN SERVER ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )