"""
Usage tracking and billing API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from database import get_db, Session as SessionModel, Agent
from models.schemas import UsageStats
from auth.dependencies import verify_deploy_key, verify_consumer_key

router = APIRouter(prefix="/usage", tags=["billing"])


@router.get("/agent/{agent_id}", response_model=UsageStats)
async def get_agent_usage(
    agent_id: str,
    owner: str = Depends(verify_deploy_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Get usage statistics for a specific agent.
    
    Only accessible by the agent owner.
    Requires V3LABS_DEPLOY_KEY header.
    
    Args:
        agent_id: Agent ID
        owner: User ID from deploy key (injected by auth)
        db: Database session
    
    Returns:
        UsageStats: Usage statistics for the agent
    """
    # Verify ownership
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    if agent.owner != owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this agent's usage"
        )
    
    # Get all sessions for this agent
    result = await db.execute(
        select(SessionModel).where(SessionModel.agent_id == agent_id)
    )
    sessions = result.scalars().all()
    
    # Calculate statistics
    total_sessions = len(sessions)
    total_duration_seconds = sum(s.duration_seconds for s in sessions)
    total_revenue = (total_duration_seconds / 60.0) * agent.price_per_minute
    
    # Format session data
    session_data = [
        {
            "session_id": s.session_id,
            "user_id": s.user_id,
            "started_at": s.started_at.isoformat(),
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "duration_seconds": s.duration_seconds,
            "status": s.status.value,
        }
        for s in sessions
    ]
    
    return UsageStats(
        total_sessions=total_sessions,
        total_duration_seconds=total_duration_seconds,
        total_revenue=total_revenue,
        sessions=session_data,
    )


@router.get("/consumer", response_model=UsageStats)
async def get_consumer_usage(
    user_id: str = Depends(verify_consumer_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Get usage statistics for a consumer.
    
    Requires V3LABS_API_KEY header.
    
    Args:
        user_id: User ID from consumer key (injected by auth)
        db: AsyncSession: Database session
    
    Returns:
        UsageStats: Usage statistics for the consumer
    """
    # Get all sessions for this user
    result = await db.execute(
        select(SessionModel).where(SessionModel.user_id == user_id)
    )
    sessions = result.scalars().all()
    
    # Calculate total cost across all agents
    total_cost = 0.0
    for session in sessions:
        # Get agent pricing
        agent_result = await db.execute(
            select(Agent).where(Agent.id == session.agent_id)
        )
        agent = agent_result.scalar_one_or_none()
        if agent:
            session_cost = (session.duration_seconds / 60.0) * agent.price_per_minute
            total_cost += session_cost
    
    # Calculate statistics
    total_sessions = len(sessions)
    total_duration_seconds = sum(s.duration_seconds for s in sessions)
    
    # Format session data
    session_data = [
        {
            "session_id": s.session_id,
            "agent_id": s.agent_id,
            "started_at": s.started_at.isoformat(),
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "duration_seconds": s.duration_seconds,
            "status": s.status.value,
        }
        for s in sessions
    ]
    
    return UsageStats(
        total_sessions=total_sessions,
        total_duration_seconds=total_duration_seconds,
        total_revenue=total_cost,  # For consumers, this is total cost
        sessions=session_data,
    )
