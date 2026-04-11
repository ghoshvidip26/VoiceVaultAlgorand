// Backend API Configuration
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_PROXY_URL || import.meta.env.VITE_API_URL;
  const defaultUrl = 'http://localhost:3000';
  const url = envUrl || defaultUrl;
  console.log('[API Config] Backend URL:', url, { envUrl, defaultUrl });
  return url;
};

export const BACKEND_CONFIG = {
  get BASE_URL() {
    return getBackendUrl();
  },
  ENDPOINTS: {
    // Unified TTS (Shelby voice models)
    UNIFIED_TTS: '/api/tts/generate',
    // Payment
    PAYMENT_BREAKDOWN: '/api/payment/breakdown',
    // Voice Model Processing & Shelby Storage
    VOICE_PROCESS: '/api/voice/process',
    SHELBY_UPLOAD: '/api/shelby/upload',
    SHELBY_DOWNLOAD: '/api/shelby/download',
    SHELBY_DELETE: '/api/shelby/delete',
  },
};

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

/**
 * Backend API client for voice operations
 */
export const backendApi = {
  /**
   * Generate speech using unified TTS endpoint (handles Shelby voice models)
   * @param modelUri Model URI (e.g., "eleven:voiceId" or "shelby://...")
   * @param text Text to convert to speech
   * @param requesterAccount Aptos account address (required for Shelby URIs)
   * @returns Audio blob
   */
  async generateTTS(modelUri: string, text: string, requesterAccount?: string): Promise<Blob> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.UNIFIED_TTS}`;
    console.log('[API] Generating TTS with unified endpoint:', { url, modelUri, textLength: text.length });

    const body: any = { modelUri, text };
    if (requesterAccount) {
      body.requesterAccount = requesterAccount;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Unified TTS error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'TTS generation failed' };
      }
      throw new Error(errorData.error || errorData.message || 'TTS generation failed');
    }

    return response.blob();
  },


  /**
   * Calculate payment breakdown
   * @param amount Amount in APT
   * @returns Payment breakdown with fees
   */
  async getPaymentBreakdown(amount: number) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.PAYMENT_BREAKDOWN}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to calculate payment breakdown');
    }

    return response.json();
  },

  /**
   * Process audio file and generate voice model bundle
   * @param audioFile Audio file to process
   * @param name Voice name
   * @param description Voice description (optional)
   * @param owner Aptos account address (owner)
   * @param voiceId Unique voice identifier
   * @returns Bundle metadata (config and meta)
   */
  async processVoiceModel(
    audioFile: File,
    name: string,
    owner: string,
    voiceId: string,
    description?: string
  ) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.VOICE_PROCESS}`;
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('name', name);
    formData.append('owner', owner);
    formData.append('voiceId', voiceId);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Voice processing failed' };
      }
      throw new Error(errorData.error || errorData.message || 'Voice processing failed');
    }

    return response.json();
  },

  /**
   * Upload voice bundle to Shelby
   * @param uri Shelby URI
   * @param account Aptos account address
   * @param bundleFiles Bundle files (embedding.bin, config.json, meta.json, preview.wav)
   * @returns Upload result with final URI
   */
  async uploadToShelby(
    uri: string,
    account: string,
    bundleFiles: {
      embedding: Blob;
      config: Blob;
      meta: Blob;
      preview?: Blob;
    }
  ) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.SHELBY_UPLOAD}`;
    
    const formData = new FormData();
    formData.append('embedding.bin', bundleFiles.embedding, 'embedding.bin');
    formData.append('config.json', bundleFiles.config, 'config.json');
    formData.append('meta.json', bundleFiles.meta, 'meta.json');
    if (bundleFiles.preview) {
      formData.append('preview.wav', bundleFiles.preview, 'preview.wav');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shelby-Uri': uri,
        'X-Aptos-Account': account,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Shelby upload failed' };
      }
      throw new Error(errorData.error || errorData.message || 'Shelby upload failed');
    }

    return response.json();
  },

  /**
   * Download file from Shelby
   * @param uri Shelby URI
   * @param filename File to download (e.g., "meta.json", "embedding.bin", "preview.wav")
   * @param requesterAccount Aptos account address (for access verification)
   * @returns File data as ArrayBuffer
   */
  async downloadFromShelby(uri: string, filename: string, requesterAccount?: string): Promise<ArrayBuffer> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.SHELBY_DOWNLOAD}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, filename, requesterAccount }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Shelby download failed' };
      }
      throw new Error(errorData.error || errorData.message || 'Shelby download failed');
    }

    return response.arrayBuffer();
  },

  /**
   * Delete voice bundle from Shelby
   * @param uri Shelby URI
   * @param account Aptos account address (owner)
   * @returns Delete result
   */
  async deleteFromShelby(uri: string, account: string) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.SHELBY_DELETE}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, account }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Shelby delete failed' };
      }
      throw new Error(errorData.error || errorData.message || 'Shelby delete failed');
    }

    return response.json();
  },

};
