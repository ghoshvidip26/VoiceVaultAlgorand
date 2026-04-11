# V3Labs – Voice Agent Deployment Platform

**Deploy, host, and monetize voice-based AI agents in the cloud.**

V3Labs is a cloud platform that provides secure public endpoints, realtime audio routing, authentication, and billing for voice agents. Think of it as **HuggingFace Inference API + Vercel, but for voice agents**.

## 🎯 What V3Labs Does

V3Labs is **not** an AI provider. Developers bring their own:
- Speech-to-Text (STT)
- Text-to-Speech (TTS)
- Voice models
- LLMs
- Agent logic

V3Labs provides:
- ✅ Secure public endpoints
- ✅ Realtime audio routing (WebSocket)
- ✅ Authentication & API keys
- ✅ Agent registry & marketplace
- ✅ Usage tracking & billing
- ✅ Discovery platform

## 🚀 Quick Start

### Installation

1. **Clone and install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database:**
```bash
python scripts/init_db.py
```

4. **Generate API keys:**
```bash
# For agent developers (deploy key)
python scripts/generate_api_key.py developer1 deploy --name "My Deploy Key"

# For consumers (consumer key)
python scripts/generate_api_key.py user1 consumer --name "My Consumer Key"
```

5. **Start the server:**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## 📖 Usage

### For Agent Developers

#### 1. Create a `v3labs.yaml` configuration file:

```yaml
agent:
  name: "Crypto Support Bot"
  description: "AI voice assistant for crypto wallets"
  endpoint: "wss://myagent.com/voice"
  protocol: "websocket"
  visibility: "public"
  price_per_minute: 0.10
  voice_type: "female"
  tags:
    - "crypto"
    - "support"
```

#### 2. Deploy your agent:

```bash
curl -X POST http://localhost:8000/agents/deploy \
  -H "V3LABS_DEPLOY_KEY: your-deploy-key" \
  -F "config_file=@v3labs.yaml"
```

**Response:**
```json
{
  "agent_id": "abc123...",
  "public_endpoint": "ws://localhost:8000/agents/abc123...",
  "message": "Agent deployed successfully"
}
```

#### 3. Monitor usage:

```bash
curl http://localhost:8000/usage/agent/abc123 \
  -H "V3LABS_DEPLOY_KEY: your-deploy-key"
```

### For Agent Consumers

#### 1. Browse the marketplace:

```bash
curl http://localhost:8000/agents
```

#### 2. Get agent details:

```bash
curl http://localhost:8000/agents/abc123
```

#### 3. Connect to an agent:

```python
import asyncio
import websockets

async def connect():
    uri = "ws://localhost:8000/agents/abc123?api_key=your-consumer-key"
    async with websockets.connect(uri) as ws:
        # Send audio data
        await ws.send(audio_bytes)
        # Receive audio response
        response = await ws.recv()

asyncio.run(connect())
```

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Consumer  │ ◄─────► │   V3Labs     │ ◄─────► │ Developer Agent │
│             │  Audio  │   Platform   │  Audio  │   (Your Agent)  │
└─────────────┘         └──────────────┘         └─────────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Database │
                        │ (SQLite) │
                        └──────────┘
```

**V3Labs acts as a secure proxy:**
1. Consumer connects to `ws://api.v3labs.ai/agents/{agent_id}`
2. V3Labs authenticates the consumer
3. V3Labs opens connection to developer's real endpoint
4. Audio streams bidirectionally through V3Labs
5. V3Labs tracks session duration for billing

**V3Labs never performs STT, TTS, or LLM inference** – it only routes audio.

## 📡 API Endpoints

### Agent Management

- **POST** `/agents/deploy` - Deploy a new agent (requires deploy key)
- **GET** `/agents` - List all public agents (marketplace)
- **GET** `/agents/{agent_id}` - Get agent details

### Realtime Streaming

- **WS** `/agents/{agent_id}` - Connect to agent via WebSocket (requires consumer key)

### Usage & Billing

- **GET** `/usage/agent/{agent_id}` - Get agent usage stats (requires deploy key)
- **GET** `/usage/consumer` - Get consumer usage stats (requires consumer key)

### System

- **GET** `/` - API information
- **GET** `/health` - Health check
- **GET** `/docs` - Interactive API documentation (Swagger UI)

## 🔑 Authentication

V3Labs uses two types of API keys:

### Deploy Keys
- Used by agent developers
- Required for deploying agents
- Header: `V3LABS_DEPLOY_KEY: v3labs_deploy_...`

### Consumer Keys
- Used by end users
- Required for connecting to agents
- Header: `V3LABS_API_KEY: v3labs_consumer_...`
- Query param: `?api_key=v3labs_consumer_...` (for WebSocket)

## 💰 Billing Model

V3Labs tracks:
- `agent_id` - Which agent was used
- `user_id` - Who used it
- `session_id` - Unique session identifier
- `duration_seconds` - How long the session lasted
- `timestamp` - When it occurred

This data enables:
- Developer payouts based on usage
- Platform revenue sharing
- Usage analytics and insights

## 📁 Project Structure

```
v3labs/
├── main.py                 # FastAPI application entry point
├── config.py               # Configuration management
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
│
├── api/                   # API endpoints
│   ├── agents.py          # Agent deployment & marketplace
│   └── billing.py         # Usage tracking & billing
│
├── auth/                  # Authentication
│   ├── api_key.py         # Key generation & validation
│   └── dependencies.py    # FastAPI auth dependencies
│
├── database/              # Database layer
│   ├── connection.py      # SQLAlchemy setup
│   └── models.py          # Database models
│
├── models/                # Pydantic schemas
│   └── schemas.py         # Request/response models
│
├── realtime/              # WebSocket proxy
│   ├── proxy.py           # Bidirectional audio streaming
│   └── session_tracker.py # Session tracking for billing
│
├── utils/                 # Utilities
│   └── yaml_parser.py     # v3labs.yaml parser
│
├── scripts/               # Utility scripts
│   ├── init_db.py         # Database initialization
│   └── generate_api_key.py # API key generation
│
└── examples/              # Example code
    ├── v3labs.yaml        # Example config
    ├── deploy_agent.py    # Deployment example
    └── connect_to_agent.py # Connection example
```

## 🛠️ Development

### Run in development mode:
```bash
uvicorn main:app --reload --port 8000
```

### View API documentation:
Open `http://localhost:8000/docs` in your browser

### Run tests:
```bash
# Coming soon
pytest
```

## 🌐 Production Deployment

For production deployment:

1. **Use PostgreSQL instead of SQLite:**
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   ```

2. **Set a secure secret key:**
   ```
   SECRET_KEY=your-secure-random-secret-key
   ```

3. **Configure CORS origins:**
   ```
   CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

4. **Update public API URL:**
   ```
   PUBLIC_API_URL=wss://api.v3labs.ai
   ```

5. **Deploy with a production ASGI server:**
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## 🔒 Security Considerations

- API keys are hashed using bcrypt before storage
- WebSocket connections require authentication
- Agent ownership is verified before showing usage data
- Rate limiting should be added for production use
- Consider adding request size limits for audio streaming

## 📝 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

This is the foundation of a real cloud platform. Contributions welcome!

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with FastAPI, SQLAlchemy, and WebSockets**
