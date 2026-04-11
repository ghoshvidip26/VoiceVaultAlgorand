import { useState } from "react";
import { useAptosWallet } from "./useAptosWallet";
import { CONTRACTS, aptToOctas, calculatePaymentBreakdown } from "@/lib/contracts";
import { toast } from "sonner";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export interface PaymentOptions {
    creatorAddress: string;
    amount: number; // in APT
    royaltyRecipient?: string; // Optional: if provided, uses royalty split
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export function usePayForInference() {
    const { signAndSubmitTransaction, isConnected, address } = useAptosWallet();
    const [isPaying, setIsPaying] = useState(false);

    /**
     * Pay for voice inference - SIMPLIFIED VERSION
     * Uses direct coin transfer instead of contract to avoid initialization issues
     */
    const payForInference = async (options: PaymentOptions) => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return null;
        }

        const { creatorAddress, amount, royaltyRecipient, onSuccess, onError } = options;

        setIsPaying(true);

        try {
            const amountInOctas = aptToOctas(amount);
            const breakdown = calculatePaymentBreakdown(amountInOctas);

            // Debug logging
            console.log("=== Payment Breakdown ===");
            console.log("Total amount:", amount, "APT =", amountInOctas, "Octas");
            console.log("Platform fee:", breakdown.platformFee, "Octas =", (breakdown.platformFee / 100_000_000).toFixed(6), "APT");
            console.log("Royalty:", breakdown.royaltyAmount, "Octas =", (breakdown.royaltyAmount / 100_000_000).toFixed(6), "APT");
            console.log("Creator:", breakdown.creatorAmount, "Octas =", (breakdown.creatorAmount / 100_000_000).toFixed(6), "APT");
            console.log("Sum check:", (breakdown.platformFee + breakdown.royaltyAmount + breakdown.creatorAmount), "should equal", amountInOctas);

            // Show breakdown before signing
            toast.info("Payment Breakdown", {
                description: `Total: ${amount} APT | Platform: ${(breakdown.platformFee / 100_000_000).toFixed(4)} APT | Royalty: ${(breakdown.royaltyAmount / 100_000_000).toFixed(4)} APT | Creator: ${(breakdown.creatorAmount / 100_000_000).toFixed(4)} APT`,
                duration: 5000,
            });

            // SIMPLIFIED: Direct coin transfers instead of using the contract
            // This avoids the PaymentEvents initialization issue

            // Transfer 1: Platform fee
            const platformTx: InputTransactionData = {
                data: {
                    function: "0x1::aptos_account::transfer",
                    typeArguments: [],
                    functionArguments: [
                        CONTRACTS.PLATFORM_ADDRESS,
                        breakdown.platformFee.toString(),
                    ],
                },
            };

            toast.info("Step 1/3: Paying platform fee...");
            await signAndSubmitTransaction(platformTx);

            // Transfer 2: Royalty
            const royaltyTx: InputTransactionData = {
                data: {
                    function: "0x1::aptos_account::transfer",
                    typeArguments: [],
                    functionArguments: [
                        royaltyRecipient || creatorAddress,
                        breakdown.royaltyAmount.toString(),
                    ],
                },
            };

            toast.info("Step 2/3: Paying royalty...");
            await signAndSubmitTransaction(royaltyTx);

            // Transfer 3: Creator payment
            const creatorTx: InputTransactionData = {
                data: {
                    function: "0x1::aptos_account::transfer",
                    typeArguments: [],
                    functionArguments: [
                        creatorAddress,
                        breakdown.creatorAmount.toString(),
                    ],
                },
            };

            toast.info("Step 3/3: Paying creator...");
            const response = await signAndSubmitTransaction(creatorTx);

            const txHash = response.hash;

            toast.success("Payment successful!", {
                description: `All payments completed! Final TX: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
            });

            // Call success callback
            if (onSuccess) {
                onSuccess(txHash);
            }

            return {
                success: true,
                transactionHash: txHash,
            };
        } catch (error: any) {
            console.error("Payment error:", error);
            const errorMessage = error.message || "Payment failed";

            toast.error("Payment failed", {
                description: errorMessage,
            });

            if (onError) {
                onError(error);
            }

            return null;
        } finally {
            setIsPaying(false);
        }
    };

    /**
     * Get payment breakdown for display before transaction
     */
    const getPaymentBreakdown = (amount: number) => {
        const amountInOctas = aptToOctas(amount);
        const breakdown = calculatePaymentBreakdown(amountInOctas);

        return {
            total: amount,
            platformFee: breakdown.platformFee / 100_000_000,
            royalty: breakdown.royaltyAmount / 100_000_000,
            creator: breakdown.creatorAmount / 100_000_000,
        };
    };

    return {
        payForInference,
        getPaymentBreakdown,
        isPaying,
    };
}
