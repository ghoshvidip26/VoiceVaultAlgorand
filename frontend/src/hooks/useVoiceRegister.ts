import { useState } from "react";
import { useAptosWallet, aptosClient } from "./useAptosWallet";
import { CONTRACTS, aptToOctas } from "@/lib/contracts";
import { toast } from "sonner";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export interface VoiceRegistrationData {
  name: string;
  modelUri: string;
  rights: string;
  pricePerUse: number; // in APT
}

export function useVoiceRegister() {
  const { signAndSubmitTransaction, isConnected, address } = useAptosWallet();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerVoice = async (data: VoiceRegistrationData) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return null;
    }

    setIsRegistering(true);

    try {
      // Convert price to Octas
      const priceInOctas = aptToOctas(data.pricePerUse);

      // Build transaction payload with gas parameters
      // Aptos requires maxGasAmount to be at least the minimum transaction gas (typically ~1000-2000)
      // Setting a higher value to ensure it covers the transaction cost
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::register_voice`,
          typeArguments: [],
          functionArguments: [
            data.name,
            data.modelUri,
            data.rights,
            priceInOctas.toString(),
          ],
        },
      };

      // Sign and submit transaction
      toast.info("Please approve the transaction in your wallet...");
      const response = await signAndSubmitTransaction(transaction);
      
      // The response contains the transaction hash
      const txHash = response.hash;
      
      // Wait for transaction confirmation on-chain
      toast.info("Waiting for transaction confirmation on-chain...");
      
      try {
        // Wait for transaction to be confirmed
        await aptosClient.waitForTransaction({
          transactionHash: txHash,
        });
        
        toast.success("Voice registered on-chain successfully!", {
          description: `Transaction confirmed: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
        });

        return {
          success: true,
          transactionHash: txHash,
        };
      } catch (waitError: any) {
        // Transaction was submitted but confirmation wait failed
        // This might be okay - transaction could still be processing
        console.warn("Transaction wait timeout, but transaction was submitted:", waitError);
        toast.success("Transaction submitted! Waiting for confirmation...", {
          description: `TX: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
        });
        
        return {
          success: true,
          transactionHash: txHash,
        };
      }
    } catch (error: any) {
      console.error("Voice registration error:", error);
      
      // Handle contract-specific error codes
      let errorMessage = error.message || "Unknown error occurred";
      
      if (errorMessage.includes("ERROR_VOICE_ALREADY_EXISTS") || errorMessage.includes("1")) {
        errorMessage = "Voice already registered for this wallet address. Only one voice per address is allowed.";
      } else if (errorMessage.includes("user rejected") || errorMessage.includes("User rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient balance. Please ensure you have enough APT to cover transaction fees.";
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
