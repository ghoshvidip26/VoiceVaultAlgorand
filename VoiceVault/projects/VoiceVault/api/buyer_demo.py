import asyncio
import os
from algosdk import account, mnemonic
from x402.http import FacilitatorConfig, HTTPFacilitatorClient
from x402.client import x402Client
from x402.http.x402_http_client import x402HTTPClient
from x402.mechanisms.avm.exact import ExactAvmBuyerScheme
from x402.schemas import ResourceInfo
import httpx

# Configuration
API_URL = "http://localhost:8000"
VOICE_OWNER = "ENTER_VOICE_OWNER_ADDRESS_HERE"
# Set these in your environment or replace here for testing
BUYER_MNEMONIC = os.getenv("BUYER_MNEMONIC", "") 
ALGOD_URL = os.getenv("ALGOD_URL", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")

async def run_buyer_demo():
    if not BUYER_MNEMONIC:
        print("Please set BUYER_MNEMONIC environment variable.")
        return

    private_key = mnemonic.to_private_key(BUYER_MNEMONIC)
    buyer_address = account.address_from_private_key(private_key)
    print(f"Agent Address: {buyer_address}")

    # 1. Setup x402 Client
    # The facilitator helps negotiate and verify payments
    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://facilitator.goplausible.xyz")
    )
    
    # The buyer client handles the 402 handshake automatically
    client = x402HTTPClient(facilitator=facilitator)
    
    # Register the AVM (Algorand) payment scheme
    # This scheme knows how to sign Algorand transactions
    client.register_scheme(
        "exact", 
        ExactAvmBuyerScheme(
            algod_url=ALGOD_URL,
            algod_token=ALGOD_TOKEN,
            private_key=private_key
        )
    )

    # 2. Make the request
    # Regular httpx-like interface, but it will handle 402 internally
    print(f"Requesting voice inference for {VOICE_OWNER}...")
    endpoint = f"{API_URL}/v1/voices/{VOICE_OWNER}/infer"
    payload = {"prompt": "Hello from an autonomous x402 agent!"}

    try:
        # call() is a helper that handles retries on 402
        response = await client.post(endpoint, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("\nSuccess! Response received:")
            print(f"Voice: {data.get('voice_name')}")
            print(f"Result: {data.get('preview_text')}")
            print(f"Payment TX: {data.get('settlement_transaction')}")
        else:
            print(f"Failed with status {response.status_code}: {response.text}")

    except Exception as e:
        print(f"Error during x402 flow: {e}")

if __name__ == "__main__":
    asyncio.run(run_buyer_demo())
