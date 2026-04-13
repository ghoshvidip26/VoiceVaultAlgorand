"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProtocolType(str, Enum):
    """Supported protocol types."""
    WEBSOCKET = "websocket"
    WEBRTC = "webrtc"


class VisibilityType(str, Enum):
    """Agent visibility types."""
    PUBLIC = "public"
    PRIVATE = "private"


class AgentConfig(BaseModel):
    """Agent configuration from v3labs.yaml."""
    name: str
    description: Optional[str] = None
    endpoint: str
    protocol: ProtocolType = ProtocolType.WEBSOCKET
    visibility: VisibilityType = VisibilityType.PUBLIC
    price_per_minute: float = 0.0
    voice_type: Optional[str] = None
    tags: Optional[List[str]] = None
    
    @validator('price_per_minute')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('price_per_minute must be non-negative')
        return v


class AgentDeployRequest(BaseModel):
    """Request body for agent deployment."""
    config: AgentConfig


class AgentResponse(BaseModel):
    """Public agent information for marketplace."""
    id: str
    name: str
    description: Optional[str]
    protocol: str
    visibility: str
    price_per_minute: float
    voice_type: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AgentDetailResponse(AgentResponse):
    """Detailed agent information including endpoint."""
    public_endpoint: str
    owner: str


class DeployResponse(BaseModel):
    """Response after successful agent deployment."""
    agent_id: str
    public_endpoint: str
    message: str


class SessionCreate(BaseModel):
    """Session creation data."""
    session_id: str
    agent_id: str
    user_id: str
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None


class SessionUpdate(BaseModel):
    """Session update data."""
    duration_seconds: int
    status: str


class UsageStats(BaseModel):
    """Usage statistics for an agent or user."""
    total_sessions: int
    total_duration_seconds: int
    total_revenue: float
    sessions: List[dict]
