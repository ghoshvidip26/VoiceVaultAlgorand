from __future__ import annotations

from contextlib import asynccontextmanager

from algosdk.error import AlgodHTTPError
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from x402 import x402ResourceServer
from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption, RouteConfig
from x402.http.middleware.fastapi import payment_middleware
from x402.mechanisms.avm.exact import ExactAvmServerScheme

from api.algorand_state import VoiceRecord, VoiceStateRepository
from api.config import Settings, get_settings


class VoiceSummary(BaseModel):
    owner: str
    voice_id: int
    name: str
    model_uri: str
    rights: str
    price_per_use: int
    created_at: int

    @classmethod
    def from_record(cls, record: VoiceRecord) -> "VoiceSummary":
        return cls(
            owner=record.owner,
            voice_id=record.voice_id,
            name=record.name,
            model_uri=record.model_uri,
            rights=record.rights,
            price_per_use=record.price_per_use,
            created_at=record.created_at,
        )


class InferenceRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class InferenceResponse(BaseModel):
    owner: str
    voice_id: int
    voice_name: str
    prompt: str
    preview_text: str
    settlement_network: str | None = None
    settlement_transaction: str | None = None


def build_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    repository = VoiceStateRepository(settings)
    app = FastAPI(title=settings.app_name)

    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url=settings.x402_facilitator_url)
    )
    resource_server = x402ResourceServer(facilitator)
    resource_server.register(settings.x402_network, ExactAvmServerScheme())

    def price_for_request(request_context) -> str:
        owner = request_context.path.rstrip("/").split("/")[-2]
        record = repository.get_voice(owner)
        if record is None or record.price_per_use <= 0:
            return settings.x402_price_fallback_usd
        return record.price_as_usd(settings.x402_price_scale)

    routes = {
        settings.x402_route_pattern: RouteConfig(
            accepts=PaymentOption(
                scheme="exact",
                pay_to=settings.x402_pay_to,
                price=price_for_request,
                network=settings.x402_network,
            ),
            resource="voice-inference",
            description="VoiceVault pay-per-use voice inference",
            mime_type="application/json",
        )
    }

    @app.middleware("http")
    async def x402_guard(request: Request, call_next):
        return await payment_middleware(
            routes=routes,
            server=resource_server,
            sync_facilitator_on_start=settings.x402_sync_facilitator_on_start,
        )(request, call_next)

    @app.get("/healthz")
    async def healthz() -> dict[str, str | int]:
        return {
            "status": "ok",
            "voice_app_id": settings.voice_app_id,
            "x402_network": settings.x402_network,
        }

    @app.get("/v1/voices/app-creator")
    async def app_creator() -> dict[str, str]:
        return {"creator": repository.get_app_creator()}

    @app.get("/v1/voices/{owner}", response_model=VoiceSummary)
    async def get_voice(owner: str) -> VoiceSummary:
        record = _load_voice_or_404(repository, owner)
        return VoiceSummary.from_record(record)

    @app.post("/v1/voices/{owner}/infer", response_model=InferenceResponse)
    async def infer(owner: str, payload: InferenceRequest, request: Request) -> InferenceResponse:
        record = _load_voice_or_404(repository, owner)
        return InferenceResponse(
            owner=owner,
            voice_id=record.voice_id,
            voice_name=record.name,
            prompt=payload.prompt,
            preview_text=f"{record.name} would say: {payload.prompt}",
            settlement_network=getattr(request.state, "payment_requirements", None).network
            if hasattr(request.state, "payment_requirements")
            else None,
            settlement_transaction=_payment_transaction(request),
        )

    return app


def _payment_transaction(request: Request) -> str | None:
    payment_payload = getattr(request.state, "payment_payload", None)
    if payment_payload is None:
        return None
    return getattr(payment_payload, "transaction", None)


def _load_voice_or_404(repository: VoiceStateRepository, owner: str) -> VoiceRecord:
    try:
        record = repository.get_voice(owner)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except AlgodHTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Algod request failed: {exc}") from exc

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Voice not found for this owner. "
                "The current VoiceApp stores records by the exact address key written on-chain."
            ),
        )
    return record


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = build_app()
