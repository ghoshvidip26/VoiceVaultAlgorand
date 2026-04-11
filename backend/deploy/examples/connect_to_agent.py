"""
Example: Connect to a V3Labs agent via WebSocket.

This script demonstrates how consumers can connect to voice agents.
"""
import asyncio
import websockets
import sys

# Configuration
AGENT_ID = "your-agent-id-here"  # Replace with actual agent ID
API_KEY = "your-consumer-key-here"  # Replace with your consumer API key
V3LABS_WS_URL = f"ws://localhost:8000/agents/{AGENT_ID}?api_key={API_KEY}"


async def connect_to_agent():
    """Connect to a voice agent via WebSocket."""
    
    print(f"Connecting to agent: {AGENT_ID}")
    print(f"WebSocket URL: {V3LABS_WS_URL}\n")
    
    try:
        async with websockets.connect(V3LABS_WS_URL) as websocket:
            print("✓ Connected to agent!")
            print("  Bidirectional audio streaming is now active")
            print("  Press Ctrl+C to disconnect\n")
            
            # Example: Send audio data
            # In a real application, you would:
            # 1. Capture audio from microphone
            # 2. Send audio chunks to the agent
            # 3. Receive audio responses from the agent
            # 4. Play audio responses through speakers
            
            async def send_audio():
                """Send audio data to agent."""
                # This is a placeholder - in real usage, send actual audio bytes
                while True:
                    # audio_chunk = capture_audio_from_mic()
                    # await websocket.send(audio_chunk)
                    await asyncio.sleep(0.1)
            
            async def receive_audio():
                """Receive audio data from agent."""
                async for message in websocket:
                    # In real usage, play the audio
                    # play_audio_to_speaker(message)
                    print(f"  Received {len(message)} bytes from agent")
            
            # Run both send and receive concurrently
            await asyncio.gather(
                send_audio(),
                receive_audio()
            )
            
    except websockets.exceptions.WebSocketException as e:
        print(f"✗ WebSocket error: {e}")
    except KeyboardInterrupt:
        print("\n✓ Disconnected from agent")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    print("V3Labs Agent Connection Example\n")
    
    if AGENT_ID == "your-agent-id-here" or API_KEY == "your-consumer-key-here":
        print("⚠️  Please update AGENT_ID and API_KEY in the script")
        sys.exit(1)
    
    asyncio.run(connect_to_agent())
