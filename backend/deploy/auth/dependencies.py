"""
FastAPI authentication dependencies.
"""
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from database import get_db, APIKey
from database.models import APIKeyType
from .api_key import verify_api_key


async def verify_deploy_key(
    v3labs_deploy_key: str = Header(..., description="Deploy API key"),
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Verify deploy API key and return user_id.
    
    Args:
        v3labs_deploy_key: Deploy API key from header
        db: Database session
    
    Returns:
        str: User ID associated with the key
    
    Raises:
        HTTPException: If key is invalid or inactive
    """
    # Query all deploy keys
    result = await db.execute(
        select(APIKey).where(
            APIKey.key_type == APIKeyType.DEPLOY,
            APIKey.is_active == True
        )
    )
    api_keys = result.scalars().all()
    
    # Verify against each key
    for api_key in api_keys:
        if verify_api_key(v3labs_deploy_key, api_key.key_hash):
            # Update last used timestamp
            api_key.last_used = datetime.utcnow()
            await db.commit()
            return api_key.user_id
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or inactive deploy key"
    )


async def verify_consumer_key(
    v3labs_api_key: str = Header(..., description="Consumer API key"),
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Verify consumer API key and return user_id.
    
    Args:
        v3labs_api_key: Consumer API key from header
        db: Database session
    
    Returns:
        str: User ID associated with the key
    
    Raises:
        HTTPException: If key is invalid or inactive
    """
    # Query all consumer keys
    result = await db.execute(
        select(APIKey).where(
            APIKey.key_type == APIKeyType.CONSUMER,
            APIKey.is_active == True
        )
    )
    api_keys = result.scalars().all()
    
    # Verify against each key
    for api_key in api_keys:
        if verify_api_key(v3labs_api_key, api_key.key_hash):
            # Update last used timestamp
            api_key.last_used = datetime.utcnow()
            await db.commit()
            return api_key.user_id
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or inactive consumer key"
    )


async def verify_consumer_key_query(
    api_key: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Verify consumer API key from query parameter (for WebSocket).
    
    Args:
        api_key: Consumer API key from query parameter
        db: Database session
    
    Returns:
        str: User ID associated with the key
    
    Raises:
        HTTPException: If key is invalid or inactive
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Query all consumer keys
    result = await db.execute(
        select(APIKey).where(
            APIKey.key_type == APIKeyType.CONSUMER,
            APIKey.is_active == True
        )
    )
    api_keys = result.scalars().all()
    
    # Verify against each key
    for api_key_obj in api_keys:
        if verify_api_key(api_key, api_key_obj.key_hash):
            # Update last used timestamp
            api_key_obj.last_used = datetime.utcnow()
            await db.commit()
            return api_key_obj.user_id
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or inactive API key"
    )
