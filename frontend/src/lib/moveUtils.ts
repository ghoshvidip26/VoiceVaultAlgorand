/**
 * Utilities for parsing Move data types from Aptos resources
 */

/**
 * Parse Move string::String type from Aptos resource data
 * Move strings can be returned as:
 * - Plain string (most common in Aptos SDK v5)
 * - Object with bytes field: { bytes: string }
 * - Hex-encoded bytes string: "0x..."
 */
export function parseMoveString(value: any): string {
  if (typeof value === "string") {
    // If it's already a plain string, return it
    return value;
  }
  
  if (value && typeof value === "object") {
    // If it's an object with bytes field
    if (value.bytes) {
      const bytesValue = value.bytes;
      if (typeof bytesValue === "string") {
        // Try to decode hex-encoded bytes
        if (bytesValue.startsWith("0x")) {
          try {
            // Use TextDecoder for browser compatibility
            const hexString = bytesValue.slice(2);
            const bytes = new Uint8Array(
              hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );
            return new TextDecoder("utf-8").decode(bytes);
          } catch {
            // Fallback: return as-is
            return bytesValue;
          }
        }
        return bytesValue;
      }
    }
    
    // If object has other structure, try to stringify
    return JSON.stringify(value);
  }
  
  return "";
}

