import { useState } from "react";
import algosdk from "algosdk";
import { toast } from "sonner";
import { useAlgorandWallet } from "./useAlgorandWallet";
import { CONTRACTS } from "@/lib/contracts";
import { algodClient } from "@/lib/algorand";

export function useVoiceUnregister() {
  const { isConnected, address, transactionSigner } = useAlgorandWallet();
  const [isUnregistering, setIsUnregistering] = useState(false);

  const unregisterVoice = async () => {
    if (!isConnected || !address || !transactionSigner) {
      toast.error("Please connect your wallet first");
      return null;
    }

    if (CONTRACTS.VOICE.appId <= 0) {
      toast.error("Voice app is not configured", {
        description: "Set VITE_VOICE_APP_ID in the frontend environment.",
      });
      return null;
    }

    setIsUnregistering(true);

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const composer = new algosdk.AtomicTransactionComposer();
      composer.addMethodCall({
        appID: CONTRACTS.VOICE.appId,
        method: algosdk.ABIMethod.fromSignature("unregister_voice()void"),
        methodArgs: [],
        sender: address,
        suggestedParams,
        signer: transactionSigner,
      });

      toast.info("Please approve the transaction in your wallet...");
      const result = await composer.execute(algodClient, 4);
      const transactionId = result.txIDs.at(-1) ?? result.txIDs[0];

      toast.success("Voice deleted on-chain successfully!", {
        description: `Transaction confirmed: ${transactionId.slice(0, 8)}...${transactionId.slice(-6)}`,
      });

      return {
        success: true,
        transactionId,
        transactionHash: transactionId,
      };
    } catch (error: any) {
      console.error("Voice unregistration error:", error);

      let errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes("not found")) {
        errorMessage = "Voice not found. No voice is registered for this wallet address.";
      } else if (errorMessage.includes("unauthorized")) {
        errorMessage = "Unauthorized. You can only delete your own voice.";
      } else if (errorMessage.includes("cancelled") || errorMessage.includes("rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient balance. Please ensure you have enough ALGO to cover transaction fees.";
      }

      toast.error("Deletion failed", {
        description: errorMessage,
        duration: 7000,
      });
      return null;
    } finally {
      setIsUnregistering(false);
    }
  };

  return {
    unregisterVoice,
    isUnregistering,
  };
}
