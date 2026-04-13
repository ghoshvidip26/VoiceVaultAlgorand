import { useState } from "react";
import algosdk from "algosdk";
import { toast } from "sonner";
import { useAlgorandWallet } from "./useAlgorandWallet";
import {
  CONTRACTS,
  algoToMicroAlgo,
  calculatePaymentBreakdown,
  microAlgoToAlgo,
} from "@/lib/contracts";
import { algodClient, isValidAlgorandAddress } from "@/lib/algorand";

export interface PaymentOptions {
  creatorAddress: string;
  amount: number; // in ALGO
  royaltyRecipient?: string;
  onSuccess?: (txId: string) => void;
  onError?: (error: Error) => void;
}

export function usePayForInference() {
  const { isConnected, address, transactionSigner } = useAlgorandWallet();
  const [isPaying, setIsPaying] = useState(false);

  const payForInference = async (options: PaymentOptions) => {
    if (!isConnected || !address || !transactionSigner) {
      toast.error("Please connect your wallet first");
      return null;
    }

    const { creatorAddress, amount, royaltyRecipient, onSuccess, onError } = options;
    const royaltyAddress = royaltyRecipient || creatorAddress;

    if (CONTRACTS.PAYMENT.appId <= 0) {
      toast.error("Payment app is not configured", {
        description: "Set VITE_PAYMENT_APP_ID in the frontend environment.",
      });
      return null;
    }

    if (!isValidAlgorandAddress(creatorAddress) || !isValidAlgorandAddress(royaltyAddress)) {
      toast.error("Invalid recipient address supplied");
      return null;
    }

    if (!isValidAlgorandAddress(CONTRACTS.PLATFORM_ADDRESS)) {
      toast.error("Platform address is not configured", {
        description: "Set VITE_PLATFORM_ADDRESS in the frontend environment.",
      });
      return null;
    }

    setIsPaying(true);

    try {
      const totalMicroAlgo = algoToMicroAlgo(amount);
      const breakdown = calculatePaymentBreakdown(totalMicroAlgo);
      const suggestedParams = await algodClient.getTransactionParams().do();

      toast.info("Payment Breakdown", {
        description: `Total: ${amount} ALGO | Platform: ${microAlgoToAlgo(breakdown.platformFee).toFixed(4)} ALGO | Royalty: ${microAlgoToAlgo(breakdown.royalty).toFixed(4)} ALGO | Creator: ${microAlgoToAlgo(breakdown.creatorAmount).toFixed(4)} ALGO`,
        duration: 5000,
      });

      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: address,
        receiver: algosdk.getApplicationAddress(CONTRACTS.PAYMENT.appId),
        amount: Number(totalMicroAlgo),
        suggestedParams,
      });

      const composer = new algosdk.AtomicTransactionComposer();
      composer.addTransaction({
        txn: paymentTxn,
        signer: transactionSigner,
      });
      composer.addMethodCall({
        appID: CONTRACTS.PAYMENT.appId,
        method: algosdk.ABIMethod.fromSignature("payWithRoyaltySplit(address,address,address,uint64)void"),
        methodArgs: [
          creatorAddress,
          CONTRACTS.PLATFORM_ADDRESS,
          royaltyAddress,
          Number(totalMicroAlgo),
        ],
        sender: address,
        suggestedParams: {
          ...suggestedParams,
          flatFee: true,
          fee: 4000,
        },
        signer: transactionSigner,
      });

      const result = await composer.execute(algodClient, 4);
      const transactionId = result.txIDs.at(-1) ?? result.txIDs[0];

      toast.success("Payment successful!", {
        description: `Atomic payment confirmed: ${transactionId.slice(0, 8)}...${transactionId.slice(-6)}`,
      });

      onSuccess?.(transactionId);

      return {
        success: true,
        transactionId,
        transactionHash: transactionId,
      };
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error.message || "Payment failed";

      toast.error("Payment failed", {
        description: errorMessage,
      });

      onError?.(error);
      return null;
    } finally {
      setIsPaying(false);
    }
  };

  const getPaymentBreakdown = (amount: number) => {
    const amountInMicroAlgo = algoToMicroAlgo(amount);
    const breakdown = calculatePaymentBreakdown(amountInMicroAlgo);

    return {
      total: amount,
      platformFee: microAlgoToAlgo(breakdown.platformFee),
      royalty: microAlgoToAlgo(breakdown.royalty),
      creator: microAlgoToAlgo(breakdown.creatorAmount),
    };
  };

  return {
    payForInference,
    getPaymentBreakdown,
    isPaying,
  };
}
