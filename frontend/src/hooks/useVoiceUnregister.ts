import { useState } from "react";
import { useAptosWallet, aptosClient } from "./useAptosWallet";
import { CONTRACTS } from "@/lib/contracts";
import { toast } from "sonner";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export function useVoiceUnregister() {
  const { signAndSubmitTransaction, isConnected, address } = useAptosWallet();
  const [isUnregistering, setIsUnregistering] = useState(false);

  const unregisterVoice = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return null;
    }

    setIsUnregistering(true);

    try {
      // Build transaction payload with gas parameters
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::unregister_voice`,
          typeArguments: [],
          functionArguments: [],
        },
        options: {
          maxGasAmount: "200000" as any, // 200,000 gas units as string (U64 format)
          gasUnitPrice: "100" as any, // Standard gas unit price for testnet (100 octas per gas unit)
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
        
        toast.success("Voice deleted on-chain successfully!", {
          description: `Transaction confirmed: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
        });

        return {
          success: true,
          transactionHash: txHash,
        };
      } catch (waitError: any) {
        // Transaction was submitted but confirmation wait failed
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
      console.error("Voice unregistration error:", error);
      
      // Handle contract-specific error codes
      let errorMessage = error.message || "Unknown error occurred";
      
      if (errorMessage.includes("ERROR_VOICE_NOT_FOUND") || errorMessage.includes("2")) {
        errorMessage = "Voice not found. No voice is registered for this wallet address.";
      } else if (errorMessage.includes("ERROR_UNAUTHORIZED") || errorMessage.includes("3")) {
        errorMessage = "Unauthorized. You can only delete your own voice.";
      } else if (errorMessage.includes("user rejected") || errorMessage.includes("User rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient balance. Please ensure you have enough APT to cover transaction fees.";
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

