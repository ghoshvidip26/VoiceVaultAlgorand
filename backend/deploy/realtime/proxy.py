"""
WebSocket proxy for realtime audio streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import websockets
import asyncio
from typing import Optional

from database import get_db, Agent
from database.models import SessionStatus
from auth.dependencies import verify_consumer_key_query
from .session_tracker import SessionTracker

router = APIRouter(tags=["realtime"])


@router.websocket("/agents/{agent_id}")
async def agent_websocket_proxy(
    websocket: WebSocket,
    agent_id: str,
    api_key: Optional[str] = Query(None, description="Consumer API key"),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket proxy endpoint for realtime audio streaming.
    
    This endpoint:
    1. Authenticates the consumer
    2. Looks up the agent's real endpoint
    3. Establishes a bidirectional WebSocket connection
    4. Streams audio data in both directions
    5. Tracks session duration for billing
    
    Args:
        websocket: Client WebSocket connection
        agent_id: Agent ID
        api_key: Consumer API key (query parameter)
        db: Database session
    """
    session_tracker = SessionTracker(db)
    session_id = None
    agent_ws = None
    
    try:
        # Accept client connection
        await websocket.accept()
        
        # Authenticate consumer
        try:
            user_id = await verify_consumer_key_query(api_key=api_key, db=db)
        except Exception as e:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
            return
        
        # Look up agent
        result = await db.execute(
            select(Agent).where(Agent.id == agent_id)
        )
        agent = result.scalar_one_or_none()
        
        if not agent:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Agent not found")
            return
        
        # Start session tracking
        session_id = await session_tracker.start_session(
            agent_id=agent_id,
            user_id=user_id,
        )
        
        # Connect to developer's agent endpoint
        try:
            agent_ws = await websockets.connect(agent.endpoint)
        except Exception as e:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Failed to connect to agent")
            if session_id:
                await session_tracker.end_session(session_id, SessionStatus.FAILED)
            return
        
        # Create bidirectional streaming tasks
        async def client_to_agent():
            """Forward messages from client to agent."""
            try:
                while True:
                    # Receive from client
                    data = await websocket.receive_bytes()
                    # Send to agent
                    await agent_ws.send(data)
            except WebSocketDisconnect:
                pass
            except Exception as e:
                print(f"Error in client_to_agent: {e}")
        
        async def agent_to_client():
            """Forward messages from agent to client."""
            try:
                async for message in agent_ws:
                    # Send to client
                    if isinstance(message, bytes):
                        await websocket.send_bytes(message)
                    else:
                        await websocket.send_text(message)
            except Exception as e:
                print(f"Error in agent_to_client: {e}")
        
        # Run both tasks concurrently
        await asyncio.gather(
            client_to_agent(),
            agent_to_client(),
            return_exceptions=True
        )
        
    except WebSocketDisconnect:
        print(f"Client disconnected from agent {agent_id}")
    except Exception as e:
        print(f"Error in WebSocket proxy: {e}")
    finally:
        # Clean up connections
        if agent_ws:
            await agent_ws.close()
        
        # End session tracking
        if session_id:
            await session_tracker.end_session(session_id, SessionStatus.COMPLETED)
        
        # Close client connection if still open
        try:
            await websocket.close()
        except:
            pass
