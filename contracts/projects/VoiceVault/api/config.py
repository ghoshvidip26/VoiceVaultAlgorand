from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from x402.mechanisms.avm import ALGORAND_TESTNET_CAIP2


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "VoiceVault x402 API"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_logo_url: str | None = None

    algod_url: str = Field(..., alias="ALGOD_URL")
    algod_token: str = Field("", alias="ALGOD_TOKEN")
    algod_headers_json: str | None = Field(None, alias="ALGOD_HEADERS_JSON")

    voice_app_id: int = Field(..., alias="VOICE_APP_ID")
    x402_pay_to: str = Field(..., alias="X402_PAY_TO")
    x402_facilitator_url: str = Field(
        "https://facilitator.goplausible.xyz",
        alias="X402_FACILITATOR_URL",
    )
    x402_network: str = Field(ALGORAND_TESTNET_CAIP2, alias="X402_NETWORK")
    x402_price_fallback_usd: str = Field("0.01", alias="X402_PRICE_FALLBACK_USD")
    x402_price_scale: int = Field(1_000_000, alias="X402_PRICE_SCALE")
    x402_route_pattern: str = "POST /v1/voices/[owner]/infer"
    x402_sync_facilitator_on_start: bool = True
    x402_testnet: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
