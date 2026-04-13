# x402 Integration Walkthrough: VoiceVault

This project integrates the **x402 protocol** (HTTP 402 Payment Required) to enable autonomous, agentic commerce for voice inference. This allows AI agents to pay for voice services per-request using Algorand.

## Current Architecture

The integration consists of a **FastAPI Resource Server** that protects the inference endpoint.

### 1. The Resource Server (`api/main.py`)
The server uses the `x402-avm` library to handle the 402 handshake.
- **Middleware**: `payment_middleware` intercepts requests to `/v1/voices/{owner}/infer`.
- **Requirements**: If a valid payment Proof (transaction ID) is not found in the headers, it returns a `402 Payment Required`.
- **Dynamic Pricing**: The price is fetched in real-time from the Algorand blockchain based on the `VoiceApp` smart contract state.

### 2. Smart Contract State (`api/algorand_state.py`)
- The server reads `price_per_use` from the `VoiceApp` global state.
- This ensures that creators can update their prices on-chain, and the API automatically reflects these changes in its 402 challenges.

---

## How to Test the Integration

### Step 1: Start the API
Ensure you have your environment variables set in `.env` (refer to `.env.example`).
```bash
poetry install
poetry run uvicorn api.main:app --reload
```

### Step 2: Use the Buyer Demo
I've created a demo script that acts as an "Agent" making a paid request.

```bash
# You will need an Algorand account with some Testnet ALGO/USDC
# Run the buyer demo (requires setting up a private key)
poetry run python api/buyer_demo.py
```

---

## Next Steps for Integration

### 1. Frontend Integration (Web Buyer)
If you want to allow humans to use this via a browser:
- You can use the `x402-js` library.
- When the API returns a 402, the JS client will prompt the user to sign a transaction with Pera/Defly.
- Once signed, it retries the request with the `Authorization: x402 <txid>` header.

### 2. Supporting USDC payments
To update the API to accept USDC instead of ALGO:
1. Update `X402_NETWORK` in your `.env` to include the asset ID:
   `algorand:testnet/asset:10458941` (example for USDC on Testnet).
2. Ensure the `X402_PAY_TO` address is opted-in to that asset.

### 3. Deploying to Testnet
Make sure your `VOICE_APP_ID` is correctly deployed on Testnet and the `X402_FACILITATOR_URL` is pointing to a live facilitator (like GoPlausible).

---

> [!NOTE]
> The x402 flow is fully automated for agents. If a client receives a 402, it looks at the `P-Payment-Options` header, constructs the transaction, signs it, and resubmits. This is the "Magic" of Agentic Commerce.
