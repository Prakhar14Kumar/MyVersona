from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Dict
import time

# Internal imports
from core.config import settings
from core.security import setup_firebase
from routes.gemini import router as gemini_router
from routes.feed import router as feed_router
from core.cache import init_redis, close_redis

# Initialize Firebase on app startup
setup_firebase()

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="A robust, modular production backend for VerSona",
        version="3.0.0"
    )

    # Attach Rate Limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Global Middleware (CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173", "https://your-versona-app.com"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount Routers
    app.include_router(gemini_router)
    app.include_router(feed_router)

    # Redis Lifecycle
    @app.on_event("startup")
    async def startup_event():
        await init_redis()

    @app.on_event("shutdown")
    async def shutdown_event():
        await close_redis()

    @app.get("/health")
    @limiter.limit("5/minute")  # Hard rate limit on public endpoints
    async def health_check(request: Request) -> Dict[str, str]:
        return {"status": "ok", "app": settings.PROJECT_NAME}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("master_main:app", host="0.0.0.0", port=8000, reload=True)
