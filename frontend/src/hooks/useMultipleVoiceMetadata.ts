import { useState, useEffect } from "react";
import {
  fetchVoiceMetadata,
  getVoiceAppGlobalState,
  VoiceMetadata,
} from "./useVoiceMetadata";

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
        const globalState = await getVoiceAppGlobalState();
        const results = await Promise.all(
          addresses.map((address) => fetchVoiceMetadata(address, globalState))
        );

        setVoices(results.filter((voice): voice is VoiceMetadata => voice !== null));
      } catch (err: any) {
        console.error("Error fetching multiple voice metadata:", err);
        setError(err.message || "Failed to fetch voices");
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMetadata();
  }, [addresses.join(",")]);

  return { voices, isLoading, error };
}
