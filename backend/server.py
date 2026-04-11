import os
import re
import math
from pathlib import Path

from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

import shelby as shelby_module
import voice_model

# Load .env from project root (one level up from backend/)
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BACKEND_DIR.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Unified TTS Endpoint ====================

# 5️⃣ Unified TTS endpoint - handles Shelby voice model URIs
# NOTE: This endpoint verifies Aptos access for Shelby URIs before loading models
@app.post("/api/tts/generate")
async def tts_generate(request: Request):
    try:
        data = await request.json()
        model_uri = data.get("modelUri")
        text = data.get("text")
        requester_account = data.get("requesterAccount")

        if not model_uri:
            return JSONResponse({"error": "modelUri parameter missing"}, status_code=400)
        if not text:
            return JSONResponse({"error": "text parameter missing"}, status_code=400)

        # Handle Shelby URIs (voice models stored on Shelby)
        if model_uri.startswith("shelby://"):
            if not requester_account:
                return JSONResponse({"error": "requesterAccount required for Shelby URIs"}, status_code=400)

            has_access = shelby_module.verify_access(model_uri, requester_account)
            if not has_access:
                return JSONResponse({
                    "error": "Access denied",
                    "message": "You must purchase this voice from the marketplace to use it.",
                }, status_code=403)

            # Download voice model files from Shelby
            try:
                embedding_buffer = shelby_module.download_from_shelby(model_uri, "embedding.bin")
            except Exception:
                embedding_buffer = None
            try:
                config_buffer = shelby_module.download_from_shelby(model_uri, "config.json")
            except Exception:
                config_buffer = None
            try:
                preview_buffer = shelby_module.download_from_shelby(model_uri, "preview.wav")
            except Exception:
                preview_buffer = None

            if not embedding_buffer or not config_buffer:
                return JSONResponse({"error": "Voice model files not found on Shelby"}, status_code=404)

            # Return preview audio — full TTS synthesis is handled client-side via Chatterbox
            if preview_buffer and len(preview_buffer) > 0:
                return Response(content=preview_buffer, media_type="audio/wav")

            return JSONResponse({"error": "No preview audio available for this voice"}, status_code=404)

        return JSONResponse({
            "error": "Unsupported model URI format",
            "message": "Supported format: 'shelby://...'",
        }, status_code=400)

    except Exception as err:
        return JSONResponse({"error": "TTS generation failed", "message": str(err)}, status_code=500)


# ==================== Payment Breakdown Calculation ====================

# 6️⃣ Calculate payment breakdown (platform fee, royalty, creator amount)
@app.post("/api/payment/breakdown")
async def payment_breakdown(request: Request):
    try:
        data = await request.json()
        amount = data.get("amount")  # Amount in APT

        if not isinstance(amount, (int, float)) or amount <= 0:
            return JSONResponse({"error": "Invalid amount. Must be a positive number"}, status_code=400)

        # Convert APT to Octas (1 APT = 100,000,000 Octas)
        amount_in_octas = math.floor(amount * 100_000_000)

        # Fixed platform fee: 2.5% (250 basis points)
        PLATFORM_FEE_BPS = 250
        platform_fee = math.floor((amount_in_octas * 250) / 10_000)
        remaining_after_platform = amount_in_octas - platform_fee

        # Fixed royalty: 10% (1000 basis points)
        ROYALTY_BPS = 1000
        royalty_amount = math.floor((remaining_after_platform * 1000) / 10_000)
        creator_amount = remaining_after_platform - royalty_amount

        return {
            "totalAmount": amount,
            "totalAmountOctas": amount_in_octas,
            "breakdown": {
                "platformFee": {
                    "amount": platform_fee / 100_000_000,
                    "amountOctas": platform_fee,
                    "percentage": 2.5,
                    "basisPoints": PLATFORM_FEE_BPS,
                },
                "royalty": {
                    "amount": royalty_amount / 100_000_000,
                    "amountOctas": royalty_amount,
                    "percentage": 10,
                    "basisPoints": ROYALTY_BPS,
                },
                "creator": {
                    "amount": creator_amount / 100_000_000,
                    "amountOctas": creator_amount,
                },
            },
        }
    except Exception as err:
        return JSONResponse({"error": "Failed to calculate payment breakdown", "message": str(err)}, status_code=500)


# ==================== Shelby Storage Integration ====================

# 7️⃣ Process audio, generate voice model bundle, and upload to Shelby
@app.post("/api/voice/process")
async def voice_process(
    audio: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    owner: str = Form(...),
    voiceId: str = Form(...),
):
    try:
        audio_buffer = await audio.read()
        mime_type = audio.content_type

        # Step 1: Process audio and generate voice model bundle
        print("[API] Processing voice model...")
        bundle = voice_model.process_voice_model(
            audio_buffer=audio_buffer,
            mime_type=mime_type,
            name=name,
            description=description,
            owner=owner,
            voice_id=voiceId,
        )

        # Step 2: Build Shelby URI
        namespace = "voices"
        shelby_uri = f"shelby://{owner}/{namespace}/{voiceId}"

        # Step 3: Upload bundle to Shelby
        print("[API] Uploading bundle to Shelby...")
        upload_result = shelby_module.upload_to_shelby(owner, namespace, voiceId, bundle["files"])

        return {
            "success": True,
            "uri": upload_result.get("uri", shelby_uri),
            "cid": upload_result["cid"],
            "bundle": {
                "config": bundle["config"],
                "meta": bundle["meta"],
            },
        }
    except Exception as err:
        print(f"[API] Voice processing error: {err}")
        return JSONResponse({"error": "Voice processing failed", "message": str(err)}, status_code=500)


# 8️⃣ Upload voice bundle to Shelby
@app.post("/api/shelby/upload")
async def shelby_upload(request: Request):
    try:
        uri = request.headers.get("x-shelby-uri")
        account = request.headers.get("x-aptos-account")

        if not uri or not account:
            return JSONResponse({"error": "Shelby URI and Aptos account are required"}, status_code=400)

        # Parse URI
        match = re.match(r"^shelby://([^/]+)/([^/]+)/(.+)$", uri)
        if not match:
            return JSONResponse({"error": "Invalid Shelby URI format"}, status_code=400)

        parsed_account, namespace, voice_id = match.group(1), match.group(2), match.group(3)

        # Verify account matches
        if parsed_account.lower() != account.lower():
            return JSONResponse({"error": "Account mismatch"}, status_code=403)

        # Prepare bundle files from multipart form
        form = await request.form()
        bundle_files = {}
        for field_name in ["embedding.bin", "config.json", "meta.json", "preview.wav"]:
            f = form.get(field_name)
            if f and hasattr(f, "read"):
                bundle_files[field_name] = await f.read()

        if not bundle_files:
            return JSONResponse({"error": "No files provided"}, status_code=400)

        # Upload to Shelby
        result = shelby_module.upload_to_shelby(account, namespace, voice_id, bundle_files)

        return {
            "success": True,
            "uri": result["uri"],
            "cid": result["cid"],
            "size": result["size"],
        }
    except Exception as err:
        print(f"[API] Shelby upload error: {err}")
        return JSONResponse({"error": "Shelby upload failed", "message": str(err)}, status_code=500)


# 9️⃣ Download file from Shelby
@app.post("/api/shelby/download")
async def shelby_download(request: Request):
    try:
        data = await request.json()
        uri = data.get("uri")
        filename = data.get("filename")
        requester_account = data.get("requesterAccount")

        if not uri or not filename:
            return JSONResponse({"error": "URI and filename are required"}, status_code=400)

        # Verify access (if requesterAccount provided)
        if requester_account:
            print(f"[API DEBUG] shelby_download called with uri={uri}, filename={filename}, requester_account={requester_account}")
            has_access = shelby_module.verify_access(uri, requester_account)
            print(f"[API DEBUG] has_access resulted in {has_access}")
            if not has_access:
                return JSONResponse({"error": "Access denied"}, status_code=403)

        # Download from Shelby
        file_buffer = shelby_module.download_from_shelby(uri, filename)

        # Set appropriate content type
        content_type = "application/octet-stream"
        if filename.endswith(".json"):
            content_type = "application/json"
        elif filename.endswith(".wav"):
            content_type = "audio/wav"
        elif filename.endswith(".bin"):
            content_type = "application/octet-stream"

        return Response(content=file_buffer, media_type=content_type)
    except shelby_module.FileNotFoundError as err:
        print("[API] Returning 404 for file not found")
        return JSONResponse({
            "error": "File not found",
            "message": str(err),
        }, status_code=404)
    except Exception as err:
        print(f"[API] Shelby download error: name={type(err).__name__}, message={err}")
        return JSONResponse({"error": "Shelby download failed", "message": str(err)}, status_code=500)


# 🔟 Delete voice bundle from Shelby
@app.post("/api/shelby/delete")
async def shelby_delete(request: Request):
    try:
        data = await request.json()
        uri = data.get("uri")
        account = data.get("account")

        if not uri or not account:
            return JSONResponse({"error": "URI and account are required"}, status_code=400)

        # Verify it's a Shelby URI
        if not uri.startswith("shelby://"):
            return JSONResponse({"error": "Invalid URI format. Must be a Shelby URI (shelby://...)"}, status_code=400)

        # Delete from Shelby (this function verifies ownership)
        result = shelby_module.delete_from_shelby(uri, account)

        return result
    except Exception as err:
        print(f"[API] Shelby delete error: {err}")
        return JSONResponse({"error": "Shelby delete failed", "message": str(err)}, status_code=500)


# ==================== Voice Metadata from Blockchain ====================
# Note: Voice registry is stored on Aptos blockchain (contract2)
# This endpoint can query blockchain directly if needed (future enhancement)
# For now, frontend queries blockchain directly using useVoiceMetadata hook

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"🔥 Voice server running → http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
