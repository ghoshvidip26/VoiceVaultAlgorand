/// <reference types="vite/client" />

interface Window {
  aptos?: {
    connect: () => Promise<{ address: string; publicKey: string }>;
    disconnect: () => Promise<void>;
    account: () => Promise<{ address: string; publicKey: string }>;
    network: () => Promise<string>;
    signMessage: (message: { message: string; nonce: string }) => Promise<{ signature: string }>;
    signTransaction: (transaction: any) => Promise<any>;
    onAccountChange?: (callback: (account: any) => void) => void;
    onNetworkChange?: (callback: (network: any) => void) => void;
  };
}
