# VoiceVault — Full Repository Analysis

## What Is VoiceVault?

VoiceVault is a **decentralized voice marketplace** built on the **Aptos blockchain**. It lets creators register, monetize, and protect their AI voice models. Buyers pay per-use in APT, and all ownership/pricing is enforced on-chain via Move smart contracts. Voice model files are stored on **Shelby** (decentralized blob storage), while the backend proxies TTS generation through **ElevenLabs**.

---

## Architecture Overview

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   React Frontend │─────►│  FastAPI Backend  │─────►│  ElevenLabs API  │
│   (Vite + TS)    │      │  (Python)         │      │  (TTS / Clone)   │
└────────┬─────────┘      └────────┬──────────┘      └──────────────────┘
         │                         │
         │  Aptos SDK              │  Local File I/O (dev)
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  Aptos Blockchain│      │  Shelby Storage   │
│  (Move Contracts)│      │  (Voice Bundles)  │
└──────────────────┘      └──────────────────┘
```

---

## 1. Backend (`backend/`)

**Stack:** Python 3 · FastAPI · httpx · uvicorn

### server.py — API Server (10 endpoints)

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | `GET` | `/api/elevenlabs/voices` | List available ElevenLabs voices |
| 2 | `POST` | `/api/elevenlabs/speak` | TTS with a specific ElevenLabs voice |
| 3 | `POST` | `/api/elevenlabs/clone` | Clone a voice via ElevenLabs (upload audio + name) |
| 4 | `POST` | `/api/tts/generate` | **Unified TTS** — routes `eleven:` or `shelby://` URIs to proper provider |
| 5 | `POST` | `/api/payment/breakdown` | Calculate fee split (2.5% platform, 10% royalty, rest to creator) |
| 6 | `POST` | `/api/voice/process` | Process raw audio → normalize → embed → bundle → upload to Shelby |
| 7 | `POST` | `/api/shelby/upload` | Direct bundle upload to Shelby storage |
| 8 | `POST` | `/api/shelby/download` | Download a file from a Shelby voice bundle |
| 9 | `POST` | `/api/shelby/delete` | Delete a voice bundle from Shelby (owner only) |
| 10 | — | — | Blockchain metadata is queried client-side, not via backend |

**Key behaviors:**
- Shared `httpx.AsyncClient` with 120s timeout (created/closed via FastAPI lifespan)
- CORS allows all origins (dev mode)
- Shelby TTS flow: verify access → download preview.wav → create temp ElevenLabs clone → generate speech → return audio
- Runs on port 3000 (`0.0.0.0`) to match frontend expectations

### shelby.py — Local Shelby Storage

Simulates Shelby decentralized blob storage using the local filesystem during development.

| Function | Description |
|----------|-------------|
| `upload_to_shelby()` | Stores bundle files at `storage/shelby/{account}/{namespace}/{voiceId}/` |
| `download_from_shelby()` | Reads a file from a Shelby URI |
| `delete_from_shelby()` | Deletes a bundle directory (owner verification) |
| `verify_access()` | Checks if requester is the owner (TODO: on-chain purchase verification) |

- URIs follow format: `shelby://<aptos_account>/voices/<voice_id>`
- Content hash (SHA-256) generated on upload for immutability tracking
- In production, would use actual Shelby RPC instead of local files

### voice_model.py — Voice Model Pipeline

Converts raw audio into a voice model bundle:

1. **Normalize** — ffmpeg: 16kHz, mono, PCM 16-bit WAV
2. **Embed** — SHA-256 hash → 256-dim float32 vector (placeholder; production would use Resemblyzer/GE2E)
3. **Bundle** — Creates `embedding.bin`, `config.json`, `meta.json`, `preview.wav` (first 5s)

### scripts/delete_all_shelby.py

Utility to recursively wipe all data in `storage/shelby/`. Used for dev cleanup.

### requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-dotenv==1.1.0
httpx==0.27.0
python-multipart==0.0.9
```

---

## 2. Smart Contracts (`contracts/`)

Two Move modules deployed on **Aptos Testnet**.

### Contract 1: `payment_contract` (payment2.move)

**Address:** `0xb0fcc...bf27`

Handles all marketplace payments with a three-way split.

| Function | Description |
|----------|-------------|
| `pay_with_royalty_split()` | Splits payment: 2.5% platform → 10% royalty → remainder to creator |
| `pay_full_to_creator()` | Direct transfer with no fees |
| `calculate_payment_breakdown()` | Pure view function returning (platform_fee, royalty, creator_amount) |

**Fee structure (hardcoded in contract):**
- Platform fee: **2.5%** (250 basis points)
- Royalty: **10%** (1000 basis points)
- Creator receives: **87.75%**

Emits three event types: `PaymentReceived`, `RoyaltyPaid`, `PlatformFeePaid`.

### Contract 2: `voice_identity` (voiceidentity2.move)

**Address:** `0xf32dc...772c`

On-chain voice NFT registry. One voice per wallet address.

| Function | Description |
|----------|-------------|
| `register_voice()` | Register a voice with name, model URI, rights, price |
| `unregister_voice()` | Owner-only deletion of their `VoiceIdentity` resource |
| `get_metadata()` | Returns full voice metadata tuple |
| `voice_exists()` | Boolean check |

**VoiceIdentity resource fields:**
- `owner`, `voice_id`, `name`, `model_uri` (Shelby URI), `rights`, `price_per_use` (in Octas), `created_at`

> Note: The frontend currently uses direct `0x1::aptos_account::transfer` for payments instead of `pay_with_royalty_split()` to avoid contract initialization issues.

---

## 3. Frontend (`frontend/`)

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · React Router · TanStack Query · Aptos Wallet Adapter

### Pages

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| **Index** | `/` | No | Landing page (Hero, Features, How It Works, CTA) |
| **Marketplace** | `/marketplace` | Wallet | Browse & purchase on-chain voices |
| **Upload** | `/upload` | Wallet | Record/upload audio → process → register on-chain + Shelby |
| **Dashboard** | `/dashboard` | Wallet | Creator stats, earnings, wallet balance (uses mock data currently) |
| **Deploy** | `/deploy` | Wallet | Placeholder — "V2 Coming Soon" (ties into `deploy/` platform) |

### Key Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `api.ts` | Backend HTTP client (all 10 endpoints). Connects to `localhost:3000` or env var |
| `shelby.ts` | `ShelbyClient` class — upload/download bundles via backend proxy. URI parsing/building |
| `contracts.ts` | Contract addresses, fee constants, `aptToOctas()`/`octasToApt()` helpers |
| `aptos.ts` | Aptos SDK client init (Testnet), balance/account helpers |
| `voiceRegistry.ts` | localStorage-based registry of known voice addresses (for marketplace discovery) |
| `purchasedVoices.ts` | localStorage tracking of purchased voices (voiceId, txHash, timestamp) |
| `clonedVoices.ts` | localStorage tracking of ElevenLabs cloned voices |
| `moveUtils.ts` | Parses Move `string::String` from Aptos resources (handles hex/bytes formats) |

### Key Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useAptosWallet` | Wraps `@aptos-labs/wallet-adapter-react` with convenience (`isConnected`, `address`, `aptosClient`) |
| `useVoiceRegister` | Submits `register_voice` transaction to voice identity contract |
| `useVoiceUnregister` | Submits `unregister_voice` transaction |
| `useVoiceMetadata` | Reads `VoiceIdentity` resource from chain for a given address |
| `useMultipleVoiceMetadata` | Batch-fetches metadata for multiple addresses |
| `useVoicesWithShelbyMetadata` | Enriches on-chain metadata with Shelby `meta.json` (name, description, preview) |
| `usePayForInference` | Three-step payment: platform fee → royalty → creator (direct `aptos_account::transfer`) |

### Wallet Integration

- Uses `@aptos-labs/wallet-adapter-react` with auto-connect
- `WalletProvider` wraps the entire app (Testnet)
- `ProtectedRoute` component gates marketplace/upload/dashboard/deploy pages behind wallet connection

### Upload Flow (the core user journey)

```
1. User records or uploads audio file
2. POST /api/voice/process → backend normalizes, embeds, bundles
3. Bundle uploaded to Shelby → returns shelby:// URI
4. User fills registration form (name, rights, price)
5. register_voice() transaction submitted to Aptos
6. Address added to localStorage voice registry
7. Voice appears in Marketplace
```

### Marketplace Purchase Flow

```
1. Marketplace reads voice addresses from localStorage registry
2. For each address: reads VoiceIdentity from chain + meta.json from Shelby
3. Buyer clicks "Purchase" → usePayForInference 3-step transfer
4. Purchase recorded in localStorage (purchasedVoices)
5. Buyer can now use voice in Upload page for TTS generation
```

---

## 4. Docs (`docs/`)

### BREAK.md — Deployment Issues Analysis

Comprehensive checklist of issues when deploying to **Render.com**:

- **Critical:** Hardcoded `localhost:3000` fallbacks in frontend
- **Critical:** Ephemeral filesystem = Shelby data lost on redeploy
- **Critical:** CORS `allow_origins=["*"]` in production
- **High:** Port binding should be `0.0.0.0`, not localhost
- **Medium:** Missing env var validation in production builds

### SHELBY.md — Shelby Integration Summary

Documents what was implemented for the Shelby storage integration:
- Client utilities, upload/download, bundle management
- Backend endpoints for voice processing and Shelby CRUD
- Upload flow changes (audio → process → Shelby → register)
- Remaining tasks: Marketplace updates, runtime TTS verification

---

## 5. Data Flow Summary

### Storage Layers

| Layer | What's Stored | Where |
|-------|--------------|-------|
| **Aptos Chain** | Voice identity (owner, name, URI, price, rights) | On-chain resources |
| **Shelby** | Voice model files (embedding.bin, config.json, meta.json, preview.wav) | Local filesystem (dev) / Shelby RPC (prod) |
| **localStorage** | Voice registry, purchased voices, cloned voices | Browser |
| **ElevenLabs** | Cloned voice snapshots (temporary) | ElevenLabs cloud |

### Fee Flow (per purchase)

```
Buyer pays X APT
  ├── 2.5%  → Platform wallet (0xb0fcc...bf27)
  ├── 10%   → Royalty recipient (configurable)
  └── 87.5% → Voice creator
```

---

## 6. Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `ELEVENLABS_API_KEY` | Backend | ElevenLabs API authentication |
| `PORT` | Backend | Server port (default: 3000) |
| `VITE_PROXY_URL` / `VITE_API_URL` | Frontend | Backend URL (default: `http://localhost:3000`) |
| `VITE_SHELBY_RPC_URL` | Frontend | Shelby RPC endpoint override |

---

## 7. Current Limitations & TODOs

1. **Voice embeddings are placeholder** — SHA-256 hash instead of real model (Resemblyzer/GE2E)
2. **Access verification is MVP** — `verify_access()` always returns `true` for non-owners; should query Aptos payment events on-chain
3. **Marketplace discovery uses localStorage** — no on-chain indexing or event scanning yet
4. **Dashboard uses mock data** — earnings/stats are hardcoded
5. **Payment uses direct transfers** — bypasses the `pay_with_royalty_split` contract function
6. **Shelby is local-only** — needs actual Shelby RPC integration for production
7. **Deploy page is placeholder** — will integrate with V3Labs platform (`backend/deploy/`)
