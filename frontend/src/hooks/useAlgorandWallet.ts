import { WalletId, useWallet } from "@txnlab/use-wallet-react";
import { microAlgoToAlgo } from "@/lib/contracts";
import { algodClient, getAlgoBalance } from "@/lib/algorand";

export function useAlgorandWallet() {
  const wallet = useWallet();
  const address = wallet.activeAddress ?? wallet.activeAccount?.address ?? null;
  const isConnected = Boolean(address);

  const peraWallet = wallet.wallets.find((item) => item.id === WalletId.PERA) ?? null;

  async function connect() {
    if (!peraWallet) {
      throw new Error("Pera wallet is not available");
    }

    await peraWallet.connect();
  }

  async function disconnect() {
    if (wallet.activeWallet?.disconnect) {
      await wallet.activeWallet.disconnect();
      return;
    }

    if (peraWallet?.disconnect) {
      await peraWallet.disconnect();
    }
  }

  async function signAndSendTxns(txns: Array<import("algosdk").Transaction>): Promise<string[]> {
    if (!wallet.transactionSigner || !address) {
      throw new Error("Wallet not connected");
    }

    const signedTxns = await wallet.transactionSigner(
      txns,
      txns.map((_, index) => index)
    );

    const { txid } = await algodClient.sendRawTransaction(signedTxns).do();
    return Array.isArray(txid) ? txid : [txid];
  }

  return {
    ...wallet,
    address,
    isConnected,
    peraWallet,
    connect,
    disconnect,
    algodClient,
    signAndSendTxns,
  };
}

export async function getAccountBalance(address: string): Promise<number> {
  try {
    const balance = await getAlgoBalance(address);
    return microAlgoToAlgo(balance);
  } catch (error) {
    console.error("Error fetching Algorand balance:", error);
    return 0;
  }
}
