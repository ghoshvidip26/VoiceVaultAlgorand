"""
Database models for V3Labs platform.
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text, Enum
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .connection import Base


class ProtocolType(str, enum.Enum):
    """Supported protocol types."""
    WEBSOCKET = "websocket"
    WEBRTC = "webrtc"


class VisibilityType(str, enum.Enum):
    """Agent visibility types."""
    PUBLIC = "public"
    PRIVATE = "private"


class APIKeyType(str, enum.Enum):
    """API key types."""
    DEPLOY = "deploy"
    CONSUMER = "consumer"


class SessionStatus(str, enum.Enum):
    """Session status types."""
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"


class Agent(Base):
    """
    Agent model - stores deployed voice agents.
    """
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    endpoint = Column(String, nullable=False)
    protocol = Column(Enum(ProtocolType), default=ProtocolType.WEBSOCKET, nullable=False)
    visibility = Column(Enum(VisibilityType), default=VisibilityType.PUBLIC, nullable=False)
    price_per_minute = Column(Float, default=0.0, nullable=False)
    owner = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Optional metadata
    voice_type = Column(String, nullable=True)
    tags = Column(Text, nullable=True)  # JSON string of tags
    

class APIKey(Base):
    """
    API Key model - stores hashed API keys for authentication.
    """
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key_hash = Column(String, unique=True, nullable=False, index=True)
    key_type = Column(Enum(APIKeyType), nullable=False)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)  # Optional friendly name
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)


class Session(Base):
    """
    Session model - tracks usage sessions for billing.
    """
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, unique=True, nullable=False, index=True)
    agent_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    
    # Optional metadata
    client_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
