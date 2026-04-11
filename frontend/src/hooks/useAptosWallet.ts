import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useMemo } from "react";

// Initialize Aptos client (use TESTNET or MAINNET based on your deployment)
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET // Change to MAINNET if deployed there
});

export const aptosClient = new Aptos(aptosConfig);

/**
 * Enhanced wallet hook with transaction utilities
 */
export function useAptosWallet() {
  const wallet = useWallet();

  const isConnected = useMemo(() => {
    return wallet.connected && !!wallet.account?.address;
  }, [wallet.connected, wallet.account]);

  const address = useMemo(() => {
    return wallet.account?.address || null;
  }, [wallet.account]);

  return {
    ...wallet,
    isConnected,
    address,
    aptosClient,
  };
}

/**
 * Get account balance in APT
 */
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const resources = await aptosClient.getAccountResources({
      accountAddress: address,
    });

    const coinResource = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );

    if (coinResource && coinResource.data) {
      const balance = (coinResource.data as any).coin.value;
      return Number(balance) / 100_000_000; // Convert Octas to APT
    }

    return 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}
