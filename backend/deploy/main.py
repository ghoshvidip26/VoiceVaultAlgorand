"""
V3Labs - Voice Agent Deployment Platform

FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from api import agents_router, billing_router
from realtime import proxy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database on startup.
    """
    # Startup
    await init_db()
    print("Database initialized")
    yield
    # Shutdown
    print("Application shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Cloud platform for deploying and hosting voice-based AI agents",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(agents_router)
app.include_router(billing_router)
app.include_router(proxy_router)


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Voice Agent Deployment Platform",
        "docs": "/docs",
        "endpoints": {
            "deploy_agent": "POST /agents/deploy",
            "list_agents": "GET /agents",
            "get_agent": "GET /agents/{agent_id}",
            "agent_websocket": "WS /agents/{agent_id}",
            "agent_usage": "GET /usage/agent/{agent_id}",
            "consumer_usage": "GET /usage/consumer",
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
