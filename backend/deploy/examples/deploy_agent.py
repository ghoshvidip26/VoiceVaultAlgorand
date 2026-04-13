"""
Example: Deploy an agent to V3Labs.

This script demonstrates how to deploy a voice agent using the V3Labs API.
"""
import requests

# Configuration
V3LABS_API_URL = "http://localhost:8000"
DEPLOY_KEY = "your-deploy-key-here"  # Replace with your actual deploy key
CONFIG_FILE_PATH = "examples/v3labs.yaml"


def deploy_agent():
    """Deploy an agent to V3Labs."""
    
    # Read configuration file
    with open(CONFIG_FILE_PATH, 'rb') as f:
        files = {'config_file': ('v3labs.yaml', f, 'application/x-yaml')}
        
        # Make deployment request
        headers = {
            'V3LABS_DEPLOY_KEY': DEPLOY_KEY
        }
        
        response = requests.post(
            f"{V3LABS_API_URL}/agents/deploy",
            files=files,
            headers=headers
        )
    
    # Check response
    if response.status_code == 201:
        data = response.json()
        print("✓ Agent deployed successfully!")
        print(f"  Agent ID: {data['agent_id']}")
        print(f"  Public Endpoint: {data['public_endpoint']}")
        print(f"\n  Consumers can now connect to your agent at:")
        print(f"  {data['public_endpoint']}?api_key=<their-consumer-key>")
    else:
        print(f"✗ Deployment failed: {response.status_code}")
        print(f"  Error: {response.text}")


if __name__ == "__main__":
    print("V3Labs Agent Deployment Example\n")
    deploy_agent()
