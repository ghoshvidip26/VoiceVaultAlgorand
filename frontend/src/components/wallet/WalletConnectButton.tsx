import { Button } from "@/components/ui/button";
import { useAlgorandWallet } from "@/hooks/useAlgorandWallet";
import { truncateAddress } from "@/lib/algorand";

export const WalletConnectButton = () => {
  const { isConnected, address, connect, disconnect } = useAlgorandWallet();

  const handleClick = async () => {
    try {
      if (isConnected) {
        await disconnect();
        return;
      }

      await connect();
    } catch (err) {
      console.error("Wallet connect/disconnect error:", err);
    }
  };

  return (
    <Button variant="default" onClick={handleClick} className="w-full">
      {isConnected && address ? truncateAddress(address, 6) : "Connect Pera"}
    </Button>
  );
};
