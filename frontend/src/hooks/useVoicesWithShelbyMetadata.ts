/**
 * Hook to fetch voices with metadata from both Aptos (on-chain) and Shelby (meta.json)
 * 
 * Architecture:
 * - Aptos stores: owner, modelUri, price, rights, voiceId (on-chain)
 * - Shelby stores: name, description, preview.wav (meta.json)
 * 
 * This hook fetches on-chain data first, then enriches with Shelby metadata
 */

import { useState, useEffect } from "react";
import { aptosClient } from "./useAptosWallet";
import { CONTRACTS, octasToApt } from "@/lib/contracts";
import { VoiceMetadata } from "./useVoiceMetadata";
import { isShelbyUri } from "@/lib/shelby";
import { parseMoveString } from "@/lib/moveUtils";

export interface VoiceWithShelbyMetadata extends VoiceMetadata {
  description?: string;
  previewAudioUrl?: string;
}

export function useVoicesWithShelbyMetadata(addresses: string[]) {
  const [voices, setVoices] = useState<VoiceWithShelbyMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      setVoices([]);
      setIsLoading(false);
      return;
    }

    const fetchAllVoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Fetch on-chain metadata from Aptos (query resource directly)
        const resourceType = `${CONTRACTS.VOICE_IDENTITY.address}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;
        const onChainPromises = addresses.map(async (address) => {
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
              name: parseMoveString(data.name), // Fallback name from on-chain
              modelUri: parseMoveString(data.model_uri),
              rights: parseMoveString(data.rights),
              pricePerUse: octasToApt(Number(data.price_per_use || 0)),
              createdAt: Number(data.created_at || 0),
            };
          } catch (err) {
            console.warn(`Failed to fetch on-chain metadata for ${address}:`, err);
            return null;
          }
        });

        const onChainResults = await Promise.all(onChainPromises);
        const validOnChainVoices = onChainResults.filter((v): v is VoiceMetadata => v !== null);

        // Step 2: Enrich with Shelby metadata (meta.json)
        const enrichedPromises = validOnChainVoices.map(async (voice) => {
          // Only fetch from Shelby if it's a Shelby URI
          if (!isShelbyUri(voice.modelUri)) {
            return voice as VoiceWithShelbyMetadata;
          }

          try {
            // Fetch meta.json from Shelby via backend API
            const { backendApi } = await import("@/lib/api");
            
            const metaBuffer = await backendApi.downloadFromShelby(voice.modelUri, "meta.json");
            const metaText = new TextDecoder().decode(metaBuffer);
            const shelbyMeta = JSON.parse(metaText);

            // Fetch preview.wav if available
            let previewAudioUrl: string | undefined;
            try {
              const previewBuffer = await backendApi.downloadFromShelby(voice.modelUri, "preview.wav");
              if (previewBuffer) {
                const previewBlob = new Blob([previewBuffer], { type: "audio/wav" });
                previewAudioUrl = URL.createObjectURL(previewBlob);
              }
            } catch (err) {
              // Preview is optional, continue without it
              console.debug(`Preview not available for ${voice.modelUri}`);
            }

            return {
              ...voice,
              name: shelbyMeta.name || voice.name, // Use Shelby name if available, fallback to on-chain
              description: shelbyMeta.description,
              previewAudioUrl,
            } as VoiceWithShelbyMetadata;
          } catch (err) {
            console.warn(`Failed to fetch Shelby metadata for ${voice.modelUri}:`, err);
            // Return voice with on-chain data only
            return voice as VoiceWithShelbyMetadata;
          }
        });

        const enrichedVoices = await Promise.all(enrichedPromises);
        setVoices(enrichedVoices);
      } catch (err: any) {
        console.error("Error fetching voices with Shelby metadata:", err);
        setError(err.message || "Failed to fetch voices");
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllVoices();
  }, [addresses.join(",")]); // Only re-fetch if addresses change

  return { voices, isLoading, error };
}

