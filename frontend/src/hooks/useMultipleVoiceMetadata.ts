import { useState, useEffect } from "react";
import { aptosClient } from "./useAptosWallet";
import { CONTRACTS, octasToApt } from "@/lib/contracts";
import { VoiceMetadata } from "./useVoiceMetadata";
import { parseMoveString } from "@/lib/moveUtils";

/**
 * Fetch metadata for multiple voice addresses in parallel
 * More efficient than calling useVoiceMetadata in a loop
 */
export function useMultipleVoiceMetadata(addresses: string[]) {
  const [voices, setVoices] = useState<VoiceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      setVoices([]);
      setIsLoading(false);
      return;
    }

    const fetchAllMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Create promises for all addresses
        const resourceType = `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;
        const promises = addresses.map(async (address) => {
          try {
            // Query the VoiceIdentity resource directly (since get_metadata is not a view function)
            const resources = await aptosClient.getAccountResources({
              accountAddress: address,
            });

            const voiceResource = resources.find((r) => r.type === resourceType);
            if (!voiceResource || !voiceResource.data) {
              return null;
            }

            const data = voiceResource.data as any;

            return {
              owner: data.owner as string,
              voiceId: data.voice_id?.toString() || "0",
              name: parseMoveString(data.name),
              modelUri: parseMoveString(data.model_uri),
              rights: parseMoveString(data.rights),
              pricePerUse: octasToApt(Number(data.price_per_use || 0)),
              createdAt: Number(data.created_at || 0),
            } as VoiceMetadata;
          } catch (err) {
            console.warn(`Failed to fetch metadata for ${address}:`, err);
            return null;
          }
        });

        // Wait for all promises to settle
        const results = await Promise.all(promises);

        // Filter out null results (failed fetches)
        const validVoices = results.filter((v): v is VoiceMetadata => v !== null);

        setVoices(validVoices);
      } catch (err: any) {
        console.error("Error fetching multiple voice metadata:", err);
        setError(err.message || "Failed to fetch voices");
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMetadata();
  }, [addresses.join(",")]); // Only re-fetch if addresses change

  return { voices, isLoading, error };
}
