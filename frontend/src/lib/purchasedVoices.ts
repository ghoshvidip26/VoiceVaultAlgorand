// Track purchased voices in localStorage

export interface PurchasedVoice {
  voiceId: string;
  name: string;
  modelUri: string;
  owner: string;
  price: number;
  purchasedAt: number;
  txHash: string;
}

const STORAGE_KEY = "voicevault_purchased_voices";

/**
 * Get all purchased voices for the current user
 */
export function getPurchasedVoices(walletAddress?: string): PurchasedVoice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const allPurchases: PurchasedVoice[] = JSON.parse(stored);

    // Filter by wallet address if provided
    if (walletAddress) {
      // In a real app, you'd track which wallet made which purchase
      // For now, return all purchases
      return allPurchases;
    }

    return allPurchases;
  } catch (error) {
    console.error("Error reading purchased voices:", error);
    return [];
  }
}

/**
 * Add a purchased voice
 */
export function addPurchasedVoice(voice: PurchasedVoice): void {
  try {
    const existing = getPurchasedVoices();
    
    // Check if already purchased
    const alreadyPurchased = existing.some(
      (v) => v.voiceId === voice.voiceId && v.owner === voice.owner
    );

    if (alreadyPurchased) {
      console.log("Voice already purchased");
      return;
    }

    existing.push(voice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    console.log("[PurchasedVoices] Added:", voice.name);
  } catch (error) {
    console.error("Error adding purchased voice:", error);
  }
}

/**
 * Check if a voice has been purchased
 */
export function isVoicePurchased(voiceId: string, owner: string): boolean {
  const purchased = getPurchasedVoices();
  return purchased.some((v) => v.voiceId === voiceId && v.owner === owner);
}

/**
 * Get purchased voices that use OpenAI models
 */
export function getPurchasedOpenAIVoices(): PurchasedVoice[] {
  const purchased = getPurchasedVoices();
  return purchased.filter((v) => v.modelUri.startsWith("openai:"));
}

/**
 * Remove a purchased voice by voiceId and owner
 */
export function removePurchasedVoice(voiceId: string, owner: string): void {
  try {
    const existing = getPurchasedVoices();
    const filtered = existing.filter(
      (v) => !(v.voiceId === voiceId && v.owner === owner)
    );
    
    if (filtered.length < existing.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log("[PurchasedVoices] Removed:", voiceId);
    }
  } catch (error) {
    console.error("Error removing purchased voice:", error);
  }
}

/**
 * Remove a purchased voice by modelUri
 */
export function removePurchasedVoiceByUri(modelUri: string): void {
  try {
    const existing = getPurchasedVoices();
    const filtered = existing.filter((v) => v.modelUri !== modelUri);
    
    if (filtered.length < existing.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log("[PurchasedVoices] Removed voice with URI:", modelUri);
    }
  } catch (error) {
    console.error("Error removing purchased voice by URI:", error);
  }
}

/**
 * Clear all purchased voices (for testing)
 */
export function clearPurchasedVoices(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log("[PurchasedVoices] Cleared all");
}
