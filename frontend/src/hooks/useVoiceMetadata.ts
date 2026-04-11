import { useState, useEffect } from "react";
import { aptosClient } from "./useAptosWallet";
import { CONTRACTS, octasToApt } from "@/lib/contracts";
import { parseMoveString } from "@/lib/moveUtils";

export interface VoiceMetadata {
  owner: string;
  voiceId: string;
  name: string;
  modelUri: string;
  rights: string;
  pricePerUse: number; // in APT
  createdAt: number; // timestamp
}

/**
 * Fetch voice metadata for a specific owner address
 */
export function useVoiceMetadata(ownerAddress: string | null) {
  const [metadata, setMetadata] = useState<VoiceMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerAddress) {
      setMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Query the VoiceIdentity resource directly (since get_metadata is not a view function)
        const resourceType = `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;
        
        let resources;
        try {
          resources = await aptosClient.getAccountResources({
            accountAddress: ownerAddress,
          });
        } catch (apiError: any) {
          // Account might not exist or have no resources - this is normal
          if (apiError.message?.includes("Account not found") || apiError.statusCode === 404) {
            setMetadata(null);
            setError(null);
            return;
          }
          throw apiError;
        }

        const voiceResource = resources.find((r) => r.type === resourceType);

        if (!voiceResource || !voiceResource.data) {
          // Resource doesn't exist - this is normal if voice hasn't been registered yet
          setMetadata(null);
          setError(null); // Don't treat as error, just no voice registered
          return;
        }

        const data = voiceResource.data as any;

        setMetadata({
          owner: data.owner as string,
          voiceId: data.voice_id?.toString() || "0",
          name: parseMoveString(data.name),
          modelUri: parseMoveString(data.model_uri),
          rights: parseMoveString(data.rights),
          pricePerUse: octasToApt(Number(data.price_per_use || 0)),
          createdAt: Number(data.created_at || 0),
        });
      } catch (err: any) {
        // Only log actual errors, not "resource not found" cases
        if (!err.message?.includes("not found") && !err.message?.includes("Account not found")) {
          console.error("Error fetching voice metadata:", err);
        }
        setError(null); // Don't show error for missing resources
        setMetadata(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [ownerAddress]);

  return { metadata, isLoading, error };
}

/**
 * Fetch voice ID for a specific owner
 */
export async function getVoiceId(ownerAddress: string): Promise<string | null> {
  try {
    const resourceType = `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;
    const resources = await aptosClient.getAccountResources({
      accountAddress: ownerAddress,
    });

    const voiceResource = resources.find((r) => r.type === resourceType);
    if (!voiceResource || !voiceResource.data) {
      return null;
    }

    const data = voiceResource.data as any;
    return data.voice_id?.toString() || null;
  } catch (error) {
    console.error("Error fetching voice ID:", error);
    return null;
  }
}

/**
 * Check if a voice exists for an owner address
 */
export async function checkVoiceExists(ownerAddress: string): Promise<boolean> {
  try {
    const resourceType = `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;
    const resources = await aptosClient.getAccountResources({
      accountAddress: ownerAddress,
    });

    return resources.some((r) => r.type === resourceType);
  } catch (error) {
    // If function fails, voice likely doesn't exist
    console.error("Error checking voice existence:", error);
    return false;
  }
}