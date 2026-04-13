import { useState } from "react";
import algosdk from "algosdk";
import { toast } from "sonner";
import { useAlgorandWallet } from "./useAlgorandWallet";
import { CONTRACTS, algoToMicroAlgo } from "@/lib/contracts";
import { algodClient } from "@/lib/algorand";

export interface VoiceRegistrationData {
  name: string;
  modelUri: string;
  rights: string;
  pricePerUse: number; // in ALGO
}

export function useVoiceRegister() {
  const { isConnected, address, transactionSigner } = useAlgorandWallet();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerVoice = async (data: VoiceRegistrationData) => {
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

    setIsRegistering(true);

    try {
      const priceInMicroAlgo = Number(algoToMicroAlgo(data.pricePerUse));
      const suggestedParams = await algodClient.getTransactionParams().do();

      const composer = new algosdk.AtomicTransactionComposer();
      composer.addMethodCall({
        appID: CONTRACTS.VOICE.appId,
        method: algosdk.ABIMethod.fromSignature("registerVoice(string,string,string,uint64)void"),
        methodArgs: [data.name, data.modelUri, data.rights, priceInMicroAlgo],
        sender: address,
        suggestedParams,
        signer: transactionSigner,
      });

      toast.info("Please approve the transaction in your wallet...");
      const result = await composer.execute(algodClient, 4);
      const transactionId = result.txIDs.at(-1) ?? result.txIDs[0];

      toast.success("Voice registered on-chain successfully!", {
        description: `Transaction confirmed: ${transactionId.slice(0, 8)}...${transactionId.slice(-6)}`,
      });

      return {
        success: true,
        transactionId,
        transactionHash: transactionId,
      };
    } catch (error: any) {
      console.error("Voice registration error:", error);

      let errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes("already exists")) {
        errorMessage = "Voice already registered for this wallet address. Only one voice per address is allowed.";
      } else if (errorMessage.includes("cancelled") || errorMessage.includes("rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient balance. Please ensure you have enough ALGO to cover transaction fees.";
      }

      toast.error("Registration failed", {
        description: errorMessage,
        duration: 7000,
      });
      return null;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerVoice,
    isRegistering,
  };
}
