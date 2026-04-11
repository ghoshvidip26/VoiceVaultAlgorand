/**
 * Client-side voice registry for tracking registered voices
 * This is stored in localStorage and can be synced across sessions
 */

const REGISTRY_KEY = "voicevault_voice_registry";

export interface VoiceRegistryEntry {
  address: string;
  name: string;
  registeredAt: number;
}

/**
 * Get all registered voice addresses from local storage
 */
export function getRegisteredVoices(): VoiceRegistryEntry[] {
  try {
    const stored = localStorage.getItem(REGISTRY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading voice registry:", error);
    return [];
  }
}

/**
 * Add a new voice to the registry
 */
export function addVoiceToRegistry(address: string, name: string): void {
  try {
    const registry = getRegisteredVoices();
    
    // Check if already exists
    const exists = registry.some((entry) => entry.address === address);
    if (exists) {
      return;
    }

    registry.push({
      address,
      name,
      registeredAt: Date.now(),
    });

    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error("Error adding to voice registry:", error);
  }
}

/**
 * Remove a voice from the registry
 */
export function removeVoiceFromRegistry(address: string): void {
  try {
    const registry = getRegisteredVoices();
    const filtered = registry.filter((entry) => entry.address !== address);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from voice registry:", error);
  }
}

/**
 * Get all voice addresses (for marketplace listing)
 */
export function getVoiceAddresses(): string[] {
  return getRegisteredVoices().map((entry) => entry.address);
}
