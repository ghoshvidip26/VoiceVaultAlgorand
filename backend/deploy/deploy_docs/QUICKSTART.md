# V3Labs - Quick Start Guide

## 🚀 How to Run V3Labs

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

---

## Step 1: Install Dependencies

Open a terminal in the `v3labs` directory and run:

```bash
pip install -r requirements.txt
```

This installs all required packages:
- FastAPI, Uvicorn, WebSockets
- SQLAlchemy, Pydantic
- Passlib, PyYAML, etc.

---

## Step 2: Set Up Environment (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

For local development, the defaults work fine. For production, edit `.env` to configure:
- Database URL
- Secret key
- CORS origins
- Public API URL

---

## Step 3: Initialize Database

Create the database tables:

```bash
python scripts/init_db.py
```

You should see:
```
Initializing database...
✓ Database initialized successfully!
✓ All tables created
```

---

## Step 4: Generate API Keys

### For Agent Developers (Deploy Key)

```bash
python scripts/generate_api_key.py developer1 deploy --name "My Deploy Key"
```

**Save the generated key!** You'll need it to deploy agents.

Example output:
```
✓ API Key created successfully!
  Type: deploy
  User ID: developer1
  Name: My Deploy Key

  API Key: v3labs_deploy_Xy9kL3mN...

⚠️  IMPORTANT: Save this key securely. It cannot be retrieved again.
```

### For Consumers (Consumer Key)

```bash
python scripts/generate_api_key.py consumer1 consumer --name "My Consumer Key"
```

**Save this key too!** Consumers need it to connect to agents.

---

## Step 5: Start the Server

Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

Or use Python directly:

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
Database initialized
INFO:     Started server process
```

**The server is now running!** 🎉

---

## Step 6: Test the API

### Option 1: Browser (Swagger UI)

Open your browser and go to:

**http://localhost:8000/docs**

This opens the interactive API documentation where you can:
- View all endpoints
- Test API calls directly
- See request/response schemas

### Option 2: Command Line (curl)

Test the health endpoint:

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "healthy"}
```

List agents (marketplace):

```bash
curl http://localhost:8000/agents
```

Response:
```json
[]
```
(Empty initially, no agents deployed yet)

---

## Step 7: Deploy Your First Agent

### Create a Configuration File

Create `my-agent.yaml`:

```yaml
agent:
  name: "My Voice Assistant"
  description: "A helpful voice AI assistant"
  endpoint: "wss://your-agent-endpoint.com/voice"
  protocol: "websocket"
  visibility: "public"
  price_per_minute: 0.10
  voice_type: "neutral"
  tags:
    - "assistant"
    - "general"
```

**Important:** Replace `endpoint` with your actual agent's WebSocket URL.

### Deploy Using curl

```bash
curl -X POST http://localhost:8000/agents/deploy \
  -H "V3LABS_DEPLOY_KEY: v3labs_deploy_YOUR_KEY_HERE" \
  -F "config_file=@my-agent.yaml"
```

Replace `YOUR_KEY_HERE` with the deploy key from Step 4.

**Success Response:**
```json
{
  "agent_id": "abc123-def456-...",
  "public_endpoint": "ws://localhost:8000/agents/abc123-def456-...",
  "message": "Agent deployed successfully"
}
```

**Save the `agent_id` and `public_endpoint`!**

### Deploy Using Python Script

Alternatively, use the example script:

1. Edit `examples/deploy_agent.py`:
   - Set `DEPLOY_KEY` to your deploy key
   - Update `CONFIG_FILE_PATH` if needed

2. Run:
```bash
python examples/deploy_agent.py
```

---

## Step 8: Connect to an Agent

### Using Python WebSocket Client

1. Edit `examples/connect_to_agent.py`:
   - Set `AGENT_ID` to your agent's ID
   - Set `API_KEY` to your consumer key

2. Run:
```bash
python examples/connect_to_agent.py
```

### Using WebSocket Test Tool

You can also use tools like:
- **wscat**: `wscat -c "ws://localhost:8000/agents/AGENT_ID?api_key=YOUR_KEY"`
- **Postman**: Create a WebSocket request
- **Browser DevTools**: Use WebSocket API

---

## Step 9: Monitor Usage

### Check Agent Usage (Developers)

```bash
curl http://localhost:8000/usage/agent/YOUR_AGENT_ID \
  -H "V3LABS_DEPLOY_KEY: YOUR_DEPLOY_KEY"
```

Response:
```json
{
  "total_sessions": 5,
  "total_duration_seconds": 1200,
  "total_revenue": 2.00,
  "sessions": [...]
}
```

### Check Consumer Usage

```bash
curl http://localhost:8000/usage/consumer \
  -H "V3LABS_API_KEY: YOUR_CONSUMER_KEY"
```

---

## Common Commands Reference

### Development

```bash
# Start server with auto-reload
uvicorn main:app --reload

# Start server on specific port
uvicorn main:app --port 8080

# Start server accessible from network
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Database

```bash
# Initialize database
python scripts/init_db.py

# Generate deploy key
python scripts/generate_api_key.py USER_ID deploy --name "KEY_NAME"

# Generate consumer key
python scripts/generate_api_key.py USER_ID consumer --name "KEY_NAME"
```

### Testing

```bash
# Health check
curl http://localhost:8000/health

# List agents
curl http://localhost:8000/agents

# Get agent details
curl http://localhost:8000/agents/AGENT_ID

# Deploy agent
curl -X POST http://localhost:8000/agents/deploy \
  -H "V3LABS_DEPLOY_KEY: KEY" \
  -F "config_file=@config.yaml"
```

---

## Troubleshooting

### Server won't start

**Error:** `ModuleNotFoundError`
- **Fix:** Run `pip install -r requirements.txt`

**Error:** `Address already in use`
- **Fix:** Change port: `uvicorn main:app --port 8001`
- Or kill existing process

### Database errors

**Error:** `no such table: agents`
- **Fix:** Run `python scripts/init_db.py`

### Authentication errors

**Error:** `Invalid or inactive deploy key`
- **Fix:** Generate new key with `generate_api_key.py`
- Make sure you're using the correct header name

### WebSocket connection fails

**Error:** `Authentication failed`
- **Fix:** Include API key in URL: `?api_key=YOUR_KEY`

**Error:** `Agent not found`
- **Fix:** Verify agent ID is correct
- Check agent exists: `curl http://localhost:8000/agents/AGENT_ID`

---

## Next Steps

### For Developers

1. **Deploy your real agent** with actual WebSocket endpoint
2. **Test the connection** end-to-end
3. **Monitor usage** and revenue
4. **Update agent settings** as needed

### For Production

1. **Switch to PostgreSQL:**
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   ```

2. **Set secure secret key:**
   ```
   SECRET_KEY=your-long-random-secret-key
   ```

3. **Configure CORS:**
   ```
   CORS_ORIGINS=https://yourdomain.com
   ```

4. **Update public URL:**
   ```
   PUBLIC_API_URL=wss://api.yourdomain.com
   ```

5. **Use production server:**
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

6. **Set up SSL/TLS** with nginx or similar

7. **Add monitoring** and logging

---

## Useful URLs

- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health
- **API Info:** http://localhost:8000/

---

## File Locations

- **Main app:** `main.py`
- **Config:** `config.py` and `.env`
- **Database:** `v3labs.db` (SQLite file)
- **Scripts:** `scripts/` directory
- **Examples:** `examples/` directory
- **Documentation:** `README.md`, `ARCHITECTURE.md`

---

## Getting Help

1. Check the **API documentation** at `/docs`
2. Read the **README.md** for detailed information
3. Review **ARCHITECTURE.md** for technical details
4. Look at **examples/** for code samples

---

## Summary

**Minimum steps to get running:**

```bash
# 1. Install
pip install -r requirements.txt

# 2. Initialize
python scripts/init_db.py

# 3. Generate keys
python scripts/generate_api_key.py dev1 deploy
python scripts/generate_api_key.py user1 consumer

# 4. Run
uvicorn main:app --reload

# 5. Test
# Open http://localhost:8000/docs
```

**That's it! You're ready to deploy voice agents!** 🎉
