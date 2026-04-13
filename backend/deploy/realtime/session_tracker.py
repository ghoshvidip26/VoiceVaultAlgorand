"""
Session tracking utilities for billing.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from database.models import Session, SessionStatus


class SessionTracker:
    """Tracks WebSocket sessions for billing purposes."""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize session tracker.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def start_session(
        self,
        agent_id: str,
        user_id: str,
        client_ip: str = None,
        user_agent: str = None
    ) -> str:
        """
        Start a new session.
        
        Args:
            agent_id: Agent ID
            user_id: User ID
            client_ip: Client IP address
            user_agent: User agent string
        
        Returns:
            str: Session ID
        """
        session_id = str(uuid.uuid4())
        
        session = Session(
            session_id=session_id,
            agent_id=agent_id,
            user_id=user_id,
            started_at=datetime.utcnow(),
            status=SessionStatus.ACTIVE,
            client_ip=client_ip,
            user_agent=user_agent,
        )
        
        self.db.add(session)
        await self.db.commit()
        
        return session_id
    
    async def end_session(self, session_id: str, status: SessionStatus = SessionStatus.COMPLETED):
        """
        End a session and calculate duration.
        
        Args:
            session_id: Session ID
            status: Final session status
        """
        result = await self.db.execute(
            select(Session).where(Session.session_id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if session:
            session.ended_at = datetime.utcnow()
            session.status = status
            
            # Calculate duration in seconds
            if session.started_at and session.ended_at:
                duration = (session.ended_at - session.started_at).total_seconds()
                session.duration_seconds = int(duration)
            
            await self.db.commit()
    
    async def get_session(self, session_id: str) -> Session:
        """
        Get session by ID.
        
        Args:
            session_id: Session ID
        
        Returns:
            Session: Session object or None
        """
        result = await self.db.execute(
            select(Session).where(Session.session_id == session_id)
        )
        return result.scalar_one_or_none()
