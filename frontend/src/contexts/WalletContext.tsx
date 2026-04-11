import type { ReactNode } from "react";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider as AlgorandWalletProvider,
} from "@txnlab/use-wallet-react";

const walletManager = new WalletManager({
  wallets: [
    {
      id: WalletId.PERA,
      options: {
        shouldShowSignTxnToast: true,
      },
    },
  ],
  defaultNetwork: NetworkId.TESTNET,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  return <AlgorandWalletProvider manager={walletManager}>{children}</AlgorandWalletProvider>;
}
