/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALGOD_SERVER?: string;
  readonly VITE_ALGOD_PORT?: string;
  readonly VITE_ALGOD_TOKEN?: string;
  readonly VITE_INDEXER_SERVER?: string;
  readonly VITE_INDEXER_PORT?: string;
  readonly VITE_INDEXER_TOKEN?: string;
  readonly VITE_PAYMENT_APP_ID?: string;
  readonly VITE_VOICE_APP_ID?: string;
  readonly VITE_PLATFORM_ADDRESS?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_PROXY_URL?: string;
  readonly VITE_SHELBY_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
