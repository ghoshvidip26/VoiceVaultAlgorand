from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from decimal import Decimal

from algosdk.encoding import decode_address
from algosdk.v2client.algod import AlgodClient

from api.config import Settings


@dataclass(frozen=True)
class VoiceRecord:
    owner: str
    voice_id: int
    name: str
    model_uri: str
    rights: str
    price_per_use: int
    created_at: int

    def price_as_usd(self, scale: int) -> str:
        if scale <= 0:
            raise ValueError("x402 price scale must be positive")
        amount = Decimal(self.price_per_use) / Decimal(scale)
        return format(amount.quantize(Decimal("0.000001")), "f")


class VoiceStateRepository:
    def __init__(self, settings: Settings):
        headers = {}
        if settings.algod_headers_json:
            headers = json.loads(settings.algod_headers_json)
        self._client = AlgodClient(settings.algod_token, settings.algod_url, headers=headers)
        self._app_id = settings.voice_app_id

    def get_voice(self, owner: str) -> VoiceRecord | None:
        owner_key = decode_address(owner)
        state = self._get_global_state()

        exists = self._get_uint64(state, b"exists_" + owner_key)
        if exists is None:
            return None

        voice_id = self._get_uint64(state, b"id_" + owner_key)
        created_at = self._get_uint64(state, b"created_" + owner_key)
        name = self._get_bytes_as_str(state, b"name_" + owner_key)
        model_uri = self._get_bytes_as_str(state, b"uri_" + owner_key)
        rights = self._get_bytes_as_str(state, b"rights_" + owner_key)
        price_per_use = self._get_uint64(state, b"price_" + owner_key)

        if None in (voice_id, created_at, name, model_uri, rights, price_per_use):
            return None

        return VoiceRecord(
            owner=owner,
            voice_id=voice_id,
            name=name,
            model_uri=model_uri,
            rights=rights,
            price_per_use=price_per_use,
            created_at=created_at,
        )

    def get_app_creator(self) -> str:
        app_info = self._client.application_info(self._app_id)
        return app_info["params"]["creator"]

    def _get_global_state(self) -> dict[bytes, dict]:
        app_info = self._client.application_info(self._app_id)
        global_state = app_info["params"].get("global-state", [])
        state_by_key: dict[bytes, dict] = {}
        for item in global_state:
            key_bytes = base64.b64decode(item["key"])
            state_by_key[key_bytes] = item["value"]
        return state_by_key

    @staticmethod
    def _get_uint64(state: dict[bytes, dict], key: bytes) -> int | None:
        value = state.get(key)
        if value is None or value.get("type") != 2:
            return None
        return int(value["uint"])

    @staticmethod
    def _get_bytes_as_str(state: dict[bytes, dict], key: bytes) -> str | None:
        value = state.get(key)
        if value is None or value.get("type") != 1:
            return None
        return base64.b64decode(value["bytes"]).decode("utf-8")
