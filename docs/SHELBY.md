Summary of Shelby Integration
I've integrated Shelby decentralized blob storage with the Aptos voice marketplace:
Completed:
Shelby Client Utilities (src/lib/shelby.ts)
URI parsing and building
Upload/download functions
Bundle management (embedding.bin, config.json, meta.json, preview.wav)
Voice Model Generation Pipeline (backend/voiceModel.js)
Audio normalization (16kHz, mono, WAV)
Embedding generation (placeholder implementation)
Bundle creation with all required files
Backend Integration (backend/server.js)
/api/voice/process - Processes audio and uploads to Shelby
/api/shelby/upload - Uploads bundles to Shelby
/api/shelby/download - Downloads files from Shelby
Updated TTS endpoint to handle Shelby URIs with access verification
Upload Flow (src/pages/Upload.tsx)
Updated to: Audio → Process → Upload to Shelby → Autofill URI
Removed ElevenLabs dependency for voice registration
Auto-fills Shelby URI in registration form
Voice Registration (src/components/voice/VoiceRegistrationForm.tsx)
Validates Shelby URIs only
Rejects non-Shelby URIs
Validates URI account matches connected wallet
Remaining Tasks:
Marketplace Updates - Update to fetch meta.json from Shelby instead of on-chain
Runtime TTS - Update to verify Aptos access before loading from Shelby
Notes:
The backend upload endpoint (/api/voice/process) processes audio and uploads to Shelby in one step
All reads go through Shelby RPC (via backend proxy)
Access verification is implemented in the TTS endpoint
Shelby URIs follow format: shelby://<aptos_account>/voices/<voice_id>
The implementation follows the architecture constraints: Shelby for storage, Aptos for access control. Voice models are stored on Shelby, while ownership, pricing, and permissions are managed on Aptos blockchain.