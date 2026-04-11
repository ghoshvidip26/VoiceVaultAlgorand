import { Button } from "@/components/ui/button";
import { useAptosWallet } from "@/hooks/useAptosWallet";

export const WalletConnectButton = () => {
  const { isConnected, address, connect, disconnect, wallets } = useAptosWallet();

  const handleClick = async () => {
    try {
      if (isConnected) {
        await disconnect();
        return;
      }

      const preferred =
        wallets.find((w) => w.name.toLowerCase().includes("petra")) ?? wallets[0];

      if (!preferred) {
        console.error("No Aptos wallets available");
        return;
      }

      await connect(preferred.name);
    } catch (err) {
      console.error("Wallet connect/disconnect error:", err);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleClick}
      className="w-full"
    >
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Petra"}
    </Button>
  );
};
