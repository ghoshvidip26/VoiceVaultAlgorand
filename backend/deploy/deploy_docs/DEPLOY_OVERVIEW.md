# V3Labs Deploy — What It Does

## Overview

The `deploy/` folder is a **standalone FastAPI microservice** called **V3Labs** — a cloud platform for **deploying, hosting, and monetizing voice-based AI agents**. It acts as secure middleware between voice agent consumers and developers' self-hosted agent backends.

**V3Labs is NOT an AI provider.** It never performs STT, TTS, or LLM inference. It is purely an **infrastructure/routing layer**.

---

## Core Functionality

### 1. Agent Deployment (`api/agents.py`)
- Developers upload a `v3labs.yaml` config file describing their voice agent (name, endpoint, protocol, pricing, tags, visibility).
- The platform registers the agent in a SQLite database and returns a **public WebSocket endpoint** consumers can connect to.
- Agents can be public (discoverable in a marketplace) or private.

### 2. Realtime Audio Proxy (`realtime/proxy.py`)
- Consumers connect to `ws://<host>/agents/{agent_id}?api_key=...`
- V3Labs authenticates the consumer, then opens a **bidirectional WebSocket tunnel** to the developer's real agent endpoint.
- Audio streams flow **client ↔ V3Labs ↔ Developer Agent** in real time.
- V3Labs tracks session start/end time for billing.

```
┌──────────┐         ┌──────────┐         ┌──────────────────┐
│ Consumer │ ◄─────► │  V3Labs  │ ◄─────► │ Developer Agent  │
│          │  Audio  │  Proxy   │  Audio  │  (self-hosted)   │
└──────────┘         └──────────┘         └──────────────────┘
```

### 3. Authentication (`auth/`)
Two types of API keys, hashed with HMAC-SHA256 before storage:

| Key Type | Header | Purpose |
|----------|--------|---------|
| **Deploy Key** | `V3LABS_DEPLOY_KEY` | Used by developers to deploy agents and view usage stats |
| **Consumer Key** | `V3LABS_API_KEY` (header or `?api_key=` query param) | Used by end-users to connect to agents |

### 4. Usage Tracking & Billing (`api/billing.py`, `realtime/session_tracker.py`)
Every WebSocket session is tracked with:
- `agent_id`, `user_id`, `session_id`
- `started_at`, `ended_at`, `duration_seconds`
- `status` (active / completed / failed)

Revenue is calculated as `duration_minutes × price_per_minute` (set by the developer per-agent).

Endpoints:
- `GET /usage/agent/{agent_id}` — Developer sees their agent's usage/revenue (requires deploy key)
- `GET /usage/consumer` — Consumer sees their own usage/cost (requires consumer key)

### 5. Database (`database/`)
- **Async SQLAlchemy** with `aiosqlite` (SQLite for dev, swappable to PostgreSQL for production)
- Three tables:
  - `agents` — registered voice agents (name, endpoint, pricing, owner, tags)
  - `api_keys` — hashed API keys with type (deploy/consumer) and user association
  - `sessions` — billing session records

### 6. YAML Config Parser (`utils/yaml_parser.py`)
Parses `v3labs.yaml` files that developers provide when deploying an agent:

```yaml
agent:
  name: "Crypto Support Bot"
  description: "AI voice assistant for crypto wallets"
  endpoint: "wss://myagent.com/voice"
  protocol: "websocket"
  visibility: "public"
  price_per_minute: 0.10
  voice_type: "female"
  tags: ["crypto", "support"]
```

### 7. Configuration (`config.py`)
Pydantic-based settings loaded from `.env`:
- `DATABASE_URL` — database connection string
- `SECRET_KEY` — application secret
- `CORS_ORIGINS` — allowed origins
- `PUBLIC_API_URL` — base URL for generated endpoints (e.g., `wss://api.v3labs.ai`)

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/agents/deploy` | Deploy Key | Deploy a new voice agent |
| `GET` | `/agents` | None | List public agents (marketplace) |
| `GET` | `/agents/{id}` | None | Get agent details |
| `WS` | `/agents/{id}` | Consumer Key (query) | Connect to agent (realtime audio) |
| `GET` | `/usage/agent/{id}` | Deploy Key | Agent usage stats |
| `GET` | `/usage/consumer` | Consumer Key | Consumer usage stats |
| `GET` | `/health` | None | Health check |
| `GET` | `/docs` | None | Swagger UI |

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `scripts/init_db.py` | `python scripts/init_db.py` | Create database tables |
| `scripts/generate_api_key.py` | `python scripts/generate_api_key.py <user_id> deploy\|consumer` | Generate API keys |

---

## Frontend (`frontend/`)
A minimal HTML/JS dashboard for testing that lets you:
- Browse deployed agents
- Deploy new agents by uploading a YAML config
- Connect to an agent via WebSocket and stream audio from the microphone

---

## Tech Stack

- **FastAPI** + **Uvicorn** (ASGI server)
- **SQLAlchemy 2.0** (async ORM) + **aiosqlite**
- **WebSockets** (bidirectional audio proxy)
- **Pydantic v2** (validation & settings)
- **HMAC-SHA256** (API key hashing)
- **PyYAML** (config parsing)

---

## How to Run

```bash
cd backend/deploy
pip install -r requirements.txt
cp .env.example .env
python scripts/init_db.py
python scripts/generate_api_key.py dev1 deploy --name "My Key"
uvicorn main:app --reload --port 8000
```
