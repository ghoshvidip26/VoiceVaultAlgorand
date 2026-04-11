import { useEffect, useState } from "react";
import algosdk from "algosdk";
import { algodClient } from "@/lib/algorand";
import { CONTRACTS, microAlgoToAlgo } from "@/lib/contracts";

export interface VoiceMetadata {
  owner: string;
  voiceId: string;
  name: string;
  modelUri: string;
  rights: string;
  pricePerUse: number; // in ALGO
  createdAt: number; // timestamp
}

interface AppStateValue {
  type: number;
  bytes?: string;
  uint?: number;
}

interface AppStateEntry {
  key: string;
  value: AppStateValue;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeStateString(base64?: string): string {
  if (!base64) return "";
  return decoder.decode(base64ToBytes(base64));
}

function buildAddressScopedKey(prefix: string, ownerAddress: string): string {
  const prefixBytes = encoder.encode(prefix);
  const addressBytes = algosdk.decodeAddress(ownerAddress).publicKey;
  const keyBytes = new Uint8Array(prefixBytes.length + addressBytes.length);

  keyBytes.set(prefixBytes);
  keyBytes.set(addressBytes, prefixBytes.length);

  return bytesToBase64(keyBytes);
}

function getStateValue(globalState: AppStateEntry[], key: string): AppStateValue | undefined {
  return globalState.find((entry) => entry.key === key)?.value;
}

export async function getVoiceAppGlobalState(): Promise<AppStateEntry[]> {
  if (CONTRACTS.VOICE.appId <= 0) {
    return [];
  }

  const app = await algodClient.getApplicationByID(CONTRACTS.VOICE.appId).do();
  return (app.params?.["global-state"] ?? []) as AppStateEntry[];
}

export async function fetchVoiceMetadata(
  ownerAddress: string,
  globalState?: AppStateEntry[]
): Promise<VoiceMetadata | null> {
  try {
    if (!ownerAddress || CONTRACTS.VOICE.appId <= 0) {
      return null;
    }

    const state = globalState ?? (await getVoiceAppGlobalState());
    const exists = getStateValue(state, buildAddressScopedKey("voice_exists_", ownerAddress));

    if (!exists || Number(exists.uint ?? 0) !== 1) {
      return null;
    }

    const voiceId = getStateValue(state, buildAddressScopedKey("voice_id_", ownerAddress));
    const name = getStateValue(state, buildAddressScopedKey("voice_name_", ownerAddress));
    const modelUri = getStateValue(state, buildAddressScopedKey("voice_uri_", ownerAddress));
    const rights = getStateValue(state, buildAddressScopedKey("voice_rights_", ownerAddress));
    const price = getStateValue(state, buildAddressScopedKey("voice_price_", ownerAddress));
    const createdAt = getStateValue(state, buildAddressScopedKey("voice_created_", ownerAddress));

    return {
      owner: ownerAddress,
      voiceId: String(voiceId?.uint ?? 0),
      name: decodeStateString(name?.bytes),
      modelUri: decodeStateString(modelUri?.bytes),
      rights: decodeStateString(rights?.bytes),
      pricePerUse: microAlgoToAlgo(BigInt(price?.uint ?? 0)),
      createdAt: Number(createdAt?.uint ?? 0),
    };
  } catch {
    return null;
  }
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
        const result = await fetchVoiceMetadata(ownerAddress);
        setMetadata(result);
      } catch (err: any) {
        console.error("Error fetching voice metadata:", err);
        setError(err.message || "Failed to fetch voice metadata");
        setMetadata(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [ownerAddress]);

  return { metadata, isLoading, error };
}

export async function getVoiceId(ownerAddress: string): Promise<string | null> {
  const metadata = await fetchVoiceMetadata(ownerAddress);
  return metadata?.voiceId ?? null;
}

export async function checkVoiceExists(ownerAddress: string): Promise<boolean> {
  const metadata = await fetchVoiceMetadata(ownerAddress);
  return metadata !== null;
}
