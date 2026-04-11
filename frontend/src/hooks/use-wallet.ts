import { useWallet as useAptosWalletAdapter } from "@aptos-labs/wallet-adapter-react";

/**
 * Thin wrapper to keep the existing `useWallet` API shape,
 * now using the Aptos wallet adapter (e.g. Petra).
 */
export function useWallet() {
  const wallet = useAptosWalletAdapter();

  return {
    connected: wallet.connected && !!wallet.account?.address,
    account: wallet.account,
  };
}
