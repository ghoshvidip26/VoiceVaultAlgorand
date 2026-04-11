/**
 * Shelby decentralized blob storage client
 * Handles voice model storage and retrieval via Shelby RPC
 * 
 * Shelby URI format: shelby://<aptos_account>/<namespace>/<voice_id>
 * 
 * All reads go through Shelby RPC, never directly to Storage Providers
 */

export interface ShelbyConfig {
  rpcUrl: string;
  network?: "shelbynet" | "testnet" | "mainnet";
}

export interface VoiceBundle {
  embedding: ArrayBuffer; // embedding.bin
  config: VoiceConfig; // config.json
  meta: VoiceMetadata; // meta.json
  preview?: ArrayBuffer; // preview.wav (optional)
}

export interface VoiceConfig {
  modelVersion: string;
  sampleRate: number;
  channels: number;
  format: "wav" | "mp3" | "opus";
  embeddingSize: number;
}

export interface VoiceMetadata {
  name: string;
  description?: string;
  owner: string;
  voiceId: string;
  createdAt: number;
  modelVersion: string;
}

export interface ShelbyUri {
  protocol: "shelby";
  account: string; // Aptos account address
  namespace: string; // e.g., "voices"
  voiceId: string;
}

/**
 * Parse Shelby URI: shelby://<account>/<namespace>/<voice_id>
 */
export function parseShelbyUri(uri: string): ShelbyUri | null {
  try {
    const match = uri.match(/^shelby:\/\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) return null;

    return {
      protocol: "shelby",
      account: match[1],
      namespace: match[2],
      voiceId: match[3],
    };
  } catch {
    return null;
  }
}

/**
 * Build Shelby URI from components
 */
export function buildShelbyUri(account: string, namespace: string, voiceId: string): string {
  return `shelby://${account}/${namespace}/${voiceId}`;
}

/**
 * Validate that a URI is a Shelby URI
 */
export function isShelbyUri(uri: string): boolean {
  return uri.startsWith("shelby://") && parseShelbyUri(uri) !== null;
}

/**
 * Get default Shelby RPC URL based on network
 */
export function getDefaultRpcUrl(network: string = "testnet"): string {
  // In production, these would be actual Shelby RPC endpoints
  // For now, we'll use environment variable or defaults
  const envUrl = import.meta.env.VITE_SHELBY_RPC_URL;
  if (envUrl) return envUrl;

  // Default RPC endpoints (these would be actual Shelby RPC servers)
  const rpcUrls: Record<string, string> = {
    testnet: "https://rpc-testnet.shelby.net",
    shelbynet: "https://rpc.shelbynet.io",
    mainnet: "https://rpc.shelby.net",
  };

  return rpcUrls[network] || rpcUrls.testnet;
}

/**
 * Shelby RPC client
 */
export class ShelbyClient {
  private rpcUrl: string;

  constructor(config?: Partial<ShelbyConfig>) {
    this.rpcUrl = config?.rpcUrl || getDefaultRpcUrl(config?.network);
  }

  /**
   * Upload a voice bundle to Shelby
   * Returns the immutable Shelby URI
   * 
   * @param account Aptos account address (owner)
   * @param namespace Namespace (typically "voices")
   * @param voiceId Unique voice identifier
   * @param bundle Voice bundle to upload
   * @returns Shelby URI
   */
  async uploadBundle(
    account: string,
    namespace: string,
    voiceId: string,
    bundle: VoiceBundle
  ): Promise<string> {
    // Construct Shelby URI
    const uri = buildShelbyUri(account, namespace, voiceId);

    // Prepare bundle files for upload
    const formData = new FormData();
    
    // Add embedding.bin
    formData.append("embedding.bin", new Blob([bundle.embedding]), "embedding.bin");
    
    // Add config.json
    formData.append("config.json", new Blob([JSON.stringify(bundle.config, null, 2)], { type: "application/json" }), "config.json");
    
    // Add meta.json
    formData.append("meta.json", new Blob([JSON.stringify(bundle.meta, null, 2)], { type: "application/json" }), "meta.json");
    
    // Add preview.wav if present
    if (bundle.preview) {
      formData.append("preview.wav", new Blob([bundle.preview], { type: "audio/wav" }), "preview.wav");
    }

    // Upload via Shelby RPC
    // Note: In production, this would use Shelby's actual RPC API
    // For now, we proxy through our backend which handles Shelby RPC calls
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/shelby/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "X-Shelby-Uri": uri,
        "X-Aptos-Account": account,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `Shelby upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.uri || uri;
  }

  /**
   * Download a file from Shelby bundle
   * All reads go through Shelby RPC
   * 
   * @param uri Shelby URI
   * @param filename File to download (e.g., "embedding.bin", "meta.json", "preview.wav")
   * @returns File data as ArrayBuffer
   */
  async downloadFile(uri: string, filename: string): Promise<ArrayBuffer> {
    const parsed = parseShelbyUri(uri);
    if (!parsed) {
      throw new Error(`Invalid Shelby URI: ${uri}`);
    }

    // Download via Shelby RPC (proxied through backend)
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/shelby/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uri, filename }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Download failed" }));
      throw new Error(error.error || `Shelby download failed: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Download and parse meta.json from Shelby bundle
   */
  async getMetadata(uri: string): Promise<VoiceMetadata> {
    const metaBuffer = await this.downloadFile(uri, "meta.json");
    const metaText = new TextDecoder().decode(metaBuffer);
    return JSON.parse(metaText) as VoiceMetadata;
  }

  /**
   * Download and parse config.json from Shelby bundle
   */
  async getConfig(uri: string): Promise<VoiceConfig> {
    const configBuffer = await this.downloadFile(uri, "config.json");
    const configText = new TextDecoder().decode(configBuffer);
    return JSON.parse(configText) as VoiceConfig;
  }

  /**
   * Download embedding.bin from Shelby bundle
   */
  async getEmbedding(uri: string): Promise<ArrayBuffer> {
    return this.downloadFile(uri, "embedding.bin");
  }

  /**
   * Download preview.wav from Shelby bundle (if available)
   */
  async getPreview(uri: string): Promise<ArrayBuffer | null> {
    try {
      return await this.downloadFile(uri, "preview.wav");
    } catch (error) {
      // Preview is optional, return null if not found
      return null;
    }
  }

  /**
   * Download entire voice bundle
   */
  async downloadBundle(uri: string): Promise<VoiceBundle> {
    const [embedding, config, meta, preview] = await Promise.all([
      this.getEmbedding(uri),
      this.getConfig(uri),
      this.getMetadata(uri),
      this.getPreview(uri).catch(() => null),
    ]);

    return {
      embedding,
      config,
      meta,
      preview: preview || undefined,
    };
  }
}

// Export default client instance
export const shelbyClient = new ShelbyClient();

