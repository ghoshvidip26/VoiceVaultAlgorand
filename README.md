# VoiceVault

- VoiceVault is a decentralized platform for creating, owning, and monetizing AI voice models. 
- Upload your voice, train custom AI models, and trade voice NFTs on the Algorand blockchain.

Consumers who want to license a voice have no transparent, decentralized marketplace: rights, payments, and usage-tracking are opaque.

- `contracts/`: an AlgoKit workspace for Algorand smart contracts
- `backend/`: a FastAPI service for voice processing and Shelby-style storage
- `frontend/`: a Vite/React marketplace and upload UI


## Architecture

```text
Creator / Buyer
    |
    v
React frontend (`frontend/`)
    |
    +--> FastAPI backend (`backend/server.py`)
    |       |
    |       +--> local Shelby-style storage (`backend/storage/shelby/`)
    |       +--> voice bundling / placeholder embeddings (`backend/voice_model.py`)
    |
    +--> intended ownership + payment settlement on Algorand (`contracts/`)
    |
    +--> client-side speech generation via Chatterbox (`frontend/src/lib/chatterbox.ts`)
```


## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- Poetry
- AlgoKit CLI 2.x+
- Docker if you want to use Algorand LocalNet
- `ffmpeg` recommended for audio normalization

### Backend

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
python backend\server.py
```

The backend listens on `http://localhost:3000` by default.

### Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:3000` for the backend unless `VITE_PROXY_URL` or `VITE_API_URL` is set.

### Algorand Contracts

If you want LocalNet:

```powershell
algokit localnet start
```

Then build the contract project:

```powershell
Set-Location contracts\projects\VoiceVault
poetry install
poetry run python -m smart_contracts build
```

Deployment needs a valid AlgoKit environment and account configuration.

## Summary

The strongest Algorand assets in this repo are the contract workspace and the payment / voice registry contract intent. The rest of the app still needs chain migration work before VoiceVault becomes a coherent end-to-end Algorand product.
