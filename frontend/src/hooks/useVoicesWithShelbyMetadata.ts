/**
 * Hook to fetch voices with metadata from both Algorand (on-chain) and Shelby (meta.json)
 *
 * Architecture:
 * - Algorand stores: owner, modelUri, price, rights, voiceId (on-chain)
 * - Shelby stores: name, description, preview.wav (meta.json)
 *
 * This hook fetches on-chain data first, then enriches with Shelby metadata
 */

import { useState, useEffect } from "react";
import { useMultipleVoiceMetadata } from "./useMultipleVoiceMetadata";
import { VoiceMetadata } from "./useVoiceMetadata";
import { isShelbyUri } from "@/lib/shelby";

export interface VoiceWithShelbyMetadata extends VoiceMetadata {
  description?: string;
  previewAudioUrl?: string;
}

export function useVoicesWithShelbyMetadata(addresses: string[]) {
  const [voices, setVoices] = useState<VoiceWithShelbyMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { voices: onChainVoices, isLoading } = useMultipleVoiceMetadata(addresses);

  useEffect(() => {
    if (!onChainVoices.length) {
      setVoices([]);
      setError(null);
      return;
    }

    const fetchAllVoices = async () => {
      setError(null);

      try {
        const enrichedVoices = await Promise.all(
          onChainVoices.map(async (voice) => {
            if (!isShelbyUri(voice.modelUri)) {
              return voice as VoiceWithShelbyMetadata;
            }

            try {
              const { backendApi } = await import("@/lib/api");

              const metaBuffer = await backendApi.downloadFromShelby(voice.modelUri, "meta.json");
              const metaText = new TextDecoder().decode(metaBuffer);
              const shelbyMeta = JSON.parse(metaText);

              let previewAudioUrl: string | undefined;
              try {
                const previewBuffer = await backendApi.downloadFromShelby(voice.modelUri, "preview.wav");
                if (previewBuffer) {
                  const previewBlob = new Blob([previewBuffer], { type: "audio/wav" });
                  previewAudioUrl = URL.createObjectURL(previewBlob);
                }
              } catch {
                previewAudioUrl = undefined;
              }

              return {
                ...voice,
                name: shelbyMeta.name || voice.name,
                description: shelbyMeta.description,
                previewAudioUrl,
              } as VoiceWithShelbyMetadata;
            } catch (err) {
              console.warn(`Failed to fetch Shelby metadata for ${voice.modelUri}:`, err);
              return voice as VoiceWithShelbyMetadata;
            }
          })
        );

        setVoices(enrichedVoices);
      } catch (err: any) {
        console.error("Error fetching voices with Shelby metadata:", err);
        setError(err.message || "Failed to fetch voices");
        setVoices([]);
      }
    };

    fetchAllVoices();
  }, [onChainVoices]);

  return { voices, isLoading, error };
}
