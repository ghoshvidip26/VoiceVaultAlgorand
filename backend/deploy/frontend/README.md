# V3Labs Frontend

A simple web interface for testing the V3Labs Voice Agent Platform backend.

## Features

- **Marketplace**: Browse and view available voice agents
- **Deploy Agent**: Deploy new agents with YAML configuration
- **Connect to Agent**: Test WebSocket connections to agents
- **Usage Stats**: View usage statistics for developers and consumers

## Setup

1. Make sure the V3Labs backend is running on `http://localhost:8000`
2. Open `index.html` in a web browser
3. Use the API keys generated from the backend scripts

## Usage

### Prerequisites

Before using the frontend, you need to:

1. **Start the backend server**:
   ```bash
   cd ../
   python main.py
   ```

2. **Generate API keys** (if not already done):
   ```bash
   # Deploy key for developers
   python scripts/generate_api_key.py developer1 deploy --name "Test Deploy Key"
   
   # Consumer key for end users
   python scripts/generate_api_key.py user1 consumer --name "Test Consumer Key"
   ```

### Testing the Platform

1. **Browse Marketplace**:
   - Click "Refresh Agents" to load available agents
   - View agent details and select agents for connection

2. **Deploy an Agent**:
   - Enter your deploy API key
   - Fill in agent details (name, description, endpoint, etc.)
   - Click "Deploy Agent"
   - The system will create a YAML configuration and deploy it

3. **Connect to Agent**:
   - Enter your consumer API key
   - Enter an agent ID (or select from marketplace)
   - Click "Connect" to establish WebSocket connection
   - Send test messages to the agent

4. **View Usage Statistics**:
   - **Agent Usage**: Enter deploy key and agent ID to view revenue stats
   - **Consumer Usage**: Enter consumer key to view usage costs

## API Keys

The frontend expects API keys in these formats:
- **Deploy Key**: `v3labs_deploy_...` (for developers)
- **Consumer Key**: `v3labs_consumer_...` (for end users)

## WebSocket Testing

The frontend includes a WebSocket client that can:
- Connect to deployed agents
- Send text messages (for testing)
- Display connection logs
- Handle connection errors gracefully

## File Structure

```
frontend/
├── index.html      # Main HTML interface
├── app.js          # JavaScript application logic
└── README.md       # This file
```

## Browser Compatibility

- Modern browsers with WebSocket support
- Bootstrap 5 and Font Awesome loaded from CDN
- No build process required - just open `index.html`

## Development

To modify the frontend:

1. Edit `index.html` for UI changes
2. Edit `app.js` for functionality changes
3. Refresh the browser to see changes

The frontend communicates with the backend via:
- REST API calls for agent management and stats
- WebSocket connections for real-time agent communication

## Troubleshooting

**API Offline**: Make sure the backend server is running on port 8000

**CORS Issues**: The backend is configured to allow localhost origins

**WebSocket Connection Failed**: 
- Check that the agent ID is correct
- Verify the consumer API key is valid
- Ensure the target agent endpoint is accessible

**Deploy Failed**: 
- Verify the deploy API key is correct
- Check that all required fields are filled
- Ensure the agent endpoint URL is valid