"""
Agent management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
import json

from database import get_db, Agent
from models.schemas import (
    AgentDeployRequest,
    AgentResponse,
    AgentDetailResponse,
    DeployResponse,
    AgentConfig,
)
from auth.dependencies import verify_deploy_key
from utils.yaml_parser import parse_v3labs_yaml
from config import settings

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/deploy", response_model=DeployResponse, status_code=status.HTTP_201_CREATED)
async def deploy_agent(
    config_file: UploadFile = File(..., description="v3labs.yaml configuration file"),
    owner: str = Depends(verify_deploy_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Deploy a new voice agent to V3Labs.
    
    Requires V3LABS_DEPLOY_KEY header for authentication.
    
    Args:
        config_file: v3labs.yaml configuration file
        owner: User ID from deploy key (injected by auth)
        db: Database session
    
    Returns:
        DeployResponse: Agent ID and public endpoint
    """
    # Read and parse YAML file
    try:
        yaml_content = await config_file.read()
        yaml_str = yaml_content.decode('utf-8')
        agent_config = parse_v3labs_yaml(yaml_str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid configuration file: {str(e)}"
        )
    
    # Generate unique agent ID
    agent_id = str(uuid.uuid4())
    
    # Create agent in database
    agent = Agent(
        id=agent_id,
        name=agent_config.name,
        description=agent_config.description,
        endpoint=agent_config.endpoint,
        protocol=agent_config.protocol,
        visibility=agent_config.visibility,
        price_per_minute=agent_config.price_per_minute,
        owner=owner,
        voice_type=agent_config.voice_type,
        tags=json.dumps(agent_config.tags) if agent_config.tags else None,
    )
    
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    
    # Generate public endpoint
    public_endpoint = f"{settings.public_api_url}/agents/{agent_id}"
    
    return DeployResponse(
        agent_id=agent_id,
        public_endpoint=public_endpoint,
        message="Agent deployed successfully"
    )


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all public agents in the marketplace.
    
    Args:
        skip: Number of agents to skip (pagination)
        limit: Maximum number of agents to return
        db: Database session
    
    Returns:
        List[AgentResponse]: List of public agents
    """
    result = await db.execute(
        select(Agent)
        .where(Agent.visibility == "public")
        .offset(skip)
        .limit(limit)
        .order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()
    
    # Convert to response models
    response_agents = []
    for agent in agents:
        tags = json.loads(agent.tags) if agent.tags else None
        response_agents.append(
            AgentResponse(
                id=agent.id,
                name=agent.name,
                description=agent.description,
                protocol=agent.protocol.value,
                visibility=agent.visibility.value,
                price_per_minute=agent.price_per_minute,
                voice_type=agent.voice_type,
                tags=tags,
                created_at=agent.created_at,
            )
        )
    
    return response_agents


@router.get("/{agent_id}", response_model=AgentDetailResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific agent.
    
    Args:
        agent_id: Agent ID
        db: Database session
    
    Returns:
        AgentDetailResponse: Detailed agent information
    """
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Generate public endpoint
    public_endpoint = f"{settings.public_api_url}/agents/{agent_id}"
    
    tags = json.loads(agent.tags) if agent.tags else None
    
    return AgentDetailResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        protocol=agent.protocol.value,
        visibility=agent.visibility.value,
        price_per_minute=agent.price_per_minute,
        voice_type=agent.voice_type,
        tags=tags,
        created_at=agent.created_at,
        public_endpoint=public_endpoint,
        owner=agent.owner,
    )
