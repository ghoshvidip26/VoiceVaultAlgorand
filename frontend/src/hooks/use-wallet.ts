import { useAlgorandWallet } from "./useAlgorandWallet";

/**
 * Thin wrapper to keep the existing `useWallet` API shape,
 * now using the Algorand wallet adapter (Pera).
 */
export function useWallet() {
  const wallet = useAlgorandWallet();

  return {
    connected: wallet.isConnected,
    account: wallet.address ? { address: wallet.address } : null,
  };
}
