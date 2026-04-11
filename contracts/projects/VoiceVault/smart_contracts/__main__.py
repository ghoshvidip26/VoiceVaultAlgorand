import base64
import json
import logging
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import algosdk
from algosdk.transaction import PaymentTxn, StateSchema
from algosdk.v2client.algod import AlgodClient
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-8s %(message)s")
logger = logging.getLogger(__name__)

ROOT_PATH = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT_PATH.parent
REPO_ROOT = ROOT_PATH.parents[3]
ARTIFACTS_ROOT = ROOT_PATH / "artifacts"
FRONTEND_CONTRACTS_DIR = REPO_ROOT / "frontend" / "src" / "contracts"

sys.path.insert(0, str(ROOT_PATH))

from hello_world.contract import app as payment_app  # noqa: E402
from hello_world.voice import app as voice_app  # noqa: E402

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(REPO_ROOT / ".env")


@dataclass
class ContractTarget:
    name: str
    app_name: str
    app: object
    global_schema: StateSchema
    local_schema: StateSchema
    min_balance_funding_algo: float


CONTRACTS = [
    ContractTarget(
        name="payment_app",
        app_name="PaymentApp",
        app=payment_app,
        global_schema=StateSchema(0, 0),
        local_schema=StateSchema(0, 0),
        min_balance_funding_algo=0.3,
    ),
    ContractTarget(
        name="voice",
        app_name="Voice",
        app=voice_app,
        global_schema=StateSchema(32, 32),
        local_schema=StateSchema(0, 0),
        min_balance_funding_algo=0.5,
    ),
]


def build_contract(target: ContractTarget):
    logger.info("Building %s", target.app_name)
    spec = target.app.build()
    output_dir = ARTIFACTS_ROOT / target.name

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    spec.export(output_dir)
    shutil.copyfile(output_dir / "application.json", output_dir / f"{target.app_name}.arc32.json")

    FRONTEND_CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(output_dir / "application.json", FRONTEND_CONTRACTS_DIR / f"{target.app_name}.arc56.json")

    return spec


def build_all() -> dict[str, object]:
    specs = {}
    for target in CONTRACTS:
        specs[target.name] = build_contract(target)
    return specs


def get_algod_client() -> AlgodClient:
    server = os.getenv("ALGOD_SERVER") or os.getenv("VITE_ALGOD_SERVER") or "https://testnet-api.algonode.cloud"
    token = os.getenv("ALGOD_TOKEN") or os.getenv("VITE_ALGOD_TOKEN") or ""
    port = os.getenv("ALGOD_PORT") or os.getenv("VITE_ALGOD_PORT") or "443"
    return AlgodClient(token, server, port)


def get_deployer_account() -> tuple[str, str]:
    mnemonic = os.getenv("DEPLOYER_MNEMONIC")
    if not mnemonic:
        raise RuntimeError("DEPLOYER_MNEMONIC is required to deploy the contracts.")

    private_key = algosdk.mnemonic.to_private_key(mnemonic)
    address = algosdk.account.address_from_private_key(private_key)
    return private_key, address


def compile_program(algod_client: AlgodClient, source: str) -> bytes:
    compiled = algod_client.compile(source).do()
    return base64.b64decode(compiled["result"])


def send_and_wait(algod_client: AlgodClient, signed_txn):
    tx_id = algod_client.send_transaction(signed_txn)
    confirmation = algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
    return tx_id, confirmation


def fund_address(
    algod_client: AlgodClient,
    private_key: str,
    sender: str,
    receiver: str,
    amount_algo: float,
) -> str:
    params = algod_client.suggested_params()
    txn = PaymentTxn(sender, params, receiver, int(amount_algo * 1_000_000))
    signed_txn = txn.sign(private_key)
    tx_id, _ = send_and_wait(algod_client, signed_txn)
    return tx_id


def deploy_contract(target: ContractTarget, spec, algod_client: AlgodClient, private_key: str, address: str):
    approval_program = compile_program(algod_client, spec.approval_program)
    clear_program = compile_program(algod_client, spec.clear_program)
    params = algod_client.suggested_params()

    txn = algosdk.transaction.ApplicationCreateTxn(
        sender=address,
        sp=params,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=target.global_schema,
        local_schema=target.local_schema,
    )

    signed_txn = txn.sign(private_key)
    tx_id, confirmation = send_and_wait(algod_client, signed_txn)
    app_id = confirmation["application-index"]
    app_address = algosdk.logic.get_application_address(app_id)

    logger.info("%s deployed: app_id=%s app_address=%s tx_id=%s", target.app_name, app_id, app_address, tx_id)

    fund_tx_id = fund_address(
        algod_client=algod_client,
        private_key=private_key,
        sender=address,
        receiver=app_address,
        amount_algo=target.min_balance_funding_algo,
    )
    logger.info("%s funded with %.3f ALGO via %s", target.app_name, target.min_balance_funding_algo, fund_tx_id)

    return {
        "app_id": app_id,
        "app_address": app_address,
        "create_tx_id": tx_id,
        "fund_tx_id": fund_tx_id,
    }


def write_frontend_env(payment_app_id: int, voice_app_id: int, platform_address: str) -> None:
    frontend_env = REPO_ROOT / "frontend" / ".env"
    env_contents = "\n".join(
        [
            "# Algorand network",
            "VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud",
            "VITE_ALGOD_PORT=443",
            "VITE_ALGOD_TOKEN=",
            "",
            "VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud",
            "VITE_INDEXER_PORT=443",
            "VITE_INDEXER_TOKEN=",
            "",
            "# Deployed contract App IDs",
            f"VITE_PAYMENT_APP_ID={payment_app_id}",
            f"VITE_VOICE_APP_ID={voice_app_id}",
            "",
            "# Platform address",
            f"VITE_PLATFORM_ADDRESS={platform_address}",
            "",
            "# Backend",
            "VITE_API_URL=http://localhost:3000",
            "VITE_PROXY_URL=http://localhost:3000",
            "",
        ]
    )
    frontend_env.write_text(env_contents, encoding="utf-8")


def deploy_all() -> dict[str, dict[str, object]]:
    specs = build_all()
    algod_client = get_algod_client()
    private_key, address = get_deployer_account()
    platform_address = os.getenv("PLATFORM_ADDRESS") or address

    deployments = {}
    for target in CONTRACTS:
        deployments[target.name] = deploy_contract(target, specs[target.name], algod_client, private_key, address)

    ARTIFACTS_ROOT.mkdir(parents=True, exist_ok=True)
    deployment_file = ARTIFACTS_ROOT / "deployments.testnet.json"
    deployment_file.write_text(json.dumps(deployments, indent=2), encoding="utf-8")

    write_frontend_env(
        payment_app_id=deployments["payment_app"]["app_id"],
        voice_app_id=deployments["voice"]["app_id"],
        platform_address=platform_address,
    )

    print(f"PAYMENT_APP_ID={deployments['payment_app']['app_id']}")
    print(f"VOICE_APP_ID={deployments['voice']['app_id']}")
    print(f"PLATFORM_ADDRESS={platform_address}")

    return deployments


def main(action: str = "build") -> None:
    if action == "build":
        build_all()
    elif action == "deploy":
        deploy_all()
    elif action == "all":
        deploy_all()
    else:
        raise ValueError(f"Unknown action: {action}")


if __name__ == "__main__":
    requested_action = sys.argv[1] if len(sys.argv) > 1 else "build"
    main(requested_action)
