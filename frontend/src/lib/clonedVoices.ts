// Track cloned voices in localStorage

export interface ClonedVoice {
  voiceId: string;
  name: string;
  clonedAt: number;
  audioFormat?: string;
}

const STORAGE_KEY = "voicevault_cloned_voices";

/**
 * Get all cloned voices
 */
export function getClonedVoices(): ClonedVoice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading cloned voices:", error);
    return [];
  }
}

/**
 * Get the most recent cloned voice (or a specific one by ID)
 */
export function getClonedVoice(voiceId?: string): ClonedVoice | null {
  const voices = getClonedVoices();
  if (voiceId) {
    return voices.find((v) => v.voiceId === voiceId) || null;
  }
  // Return most recent
  return voices.length > 0 ? voices[voices.length - 1] : null;
}

/**
 * Add a cloned voice
 */
export function addClonedVoice(voice: ClonedVoice): void {
  try {
    const existing = getClonedVoices();
    
    // Check if already exists
    const alreadyExists = existing.some((v) => v.voiceId === voice.voiceId);
    
    if (alreadyExists) {
      // Update existing
      const index = existing.findIndex((v) => v.voiceId === voice.voiceId);
      existing[index] = voice;
    } else {
      // Add new
      existing.push(voice);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    console.log("[ClonedVoices] Saved:", voice.name, voice.voiceId);
  } catch (error) {
    console.error("Error adding cloned voice:", error);
  }
}

/**
 * Remove a cloned voice
 */
export function removeClonedVoice(voiceId: string): void {
  try {
    const existing = getClonedVoices();
    const filtered = existing.filter((v) => v.voiceId !== voiceId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing cloned voice:", error);
  }
}

/**
 * Clear all cloned voices
 */
export function clearClonedVoices(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing cloned voices:", error);
  }
}

