"""
Simple Test Voice Agent - WebSocket Server

This is a MINIMAL example voice agent that V3Labs can proxy to.
In production, this would include actual STT, TTS, and LLM processing.
"""
import asyncio
import websockets
import json


async def voice_agent_handler(websocket, path):
    """
    Handle incoming WebSocket connections from V3Labs.
    
    In a real agent, you would:
    1. Receive audio bytes from the client
    2. Convert speech to text (STT)
    3. Process with LLM
    4. Convert response to speech (TTS)
    5. Send audio bytes back to client
    """
    print(f"New connection from: {websocket.remote_address}")
    
    try:
        # Send welcome message
        welcome = {
            "type": "message",
            "text": "Connected to test voice agent!"
        }
        await websocket.send(json.dumps(welcome))
        
        # Echo loop - in production, this would be your AI processing
        async for message in websocket:
            print(f"Received {len(message)} bytes")
            
            # In a real agent, you would:
            # 1. audio_bytes = message
            # 2. text = speech_to_text(audio_bytes)
            # 3. response = llm_process(text)
            # 4. audio_response = text_to_speech(response)
            # 5. await websocket.send(audio_response)
            
            # For now, just echo back
            await websocket.send(message)
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Start the voice agent WebSocket server."""
    
    # Start server on port 8765
    server = await websockets.serve(
        voice_agent_handler,
        "0.0.0.0",
        8765
    )
    
    print("=" * 60)
    print("🎤 Test Voice Agent Running!")
    print("=" * 60)
    print(f"WebSocket URL: ws://localhost:8765")
    print(f"Use this in v3labs.yaml:")
    print(f'  endpoint: "ws://localhost:8765"')
    print("=" * 60)
    print("\nWaiting for connections... (Press Ctrl+C to stop)")
    
    await server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nShutting down voice agent...")
