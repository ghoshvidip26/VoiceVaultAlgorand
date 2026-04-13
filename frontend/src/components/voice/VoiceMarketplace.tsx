import { useState, useEffect } from "react";
import { VoiceMetadata, useVoiceMetadata } from "@/hooks/useVoiceMetadata";
import { VoiceMarketplaceCard } from "./VoiceMarketplaceCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon } from "lucide-react";

// Client-side list of known voice creator addresses
// In production, you could:
// 1. Maintain this list in localStorage
// 2. Query events from the blockchain
// 3. Use a decentralized registry
const KNOWN_VOICE_CREATORS = [
  // Add addresses of users who have registered voices
  // Example: "0x1234...",
];

interface VoiceMarketplaceProps {
  onVoiceSelected?: (voice: VoiceMetadata, txHash: string) => void;
}

export function VoiceMarketplace({ onVoiceSelected }: VoiceMarketplaceProps) {
  const [voiceAddresses, setVoiceAddresses] = useState<string[]>(KNOWN_VOICE_CREATORS);
  const [voices, setVoices] = useState<VoiceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch metadata for all known addresses
  useEffect(() => {
    const fetchAllVoices = async () => {
      setIsLoading(true);
      const fetchedVoices: VoiceMetadata[] = [];

      for (const address of voiceAddresses) {
        try {
          // This is a simplified approach - in production you'd use a more efficient method
          const { metadata } = useVoiceMetadata(address);
          if (metadata) {
            fetchedVoices.push(metadata);
          }
        } catch (error) {
          console.error(`Failed to fetch voice for ${address}:`, error);
        }
      }

      setVoices(fetchedVoices);
      setIsLoading(false);
    };

    if (voiceAddresses.length > 0) {
      fetchAllVoices();
    } else {
      setIsLoading(false);
    }
  }, [voiceAddresses]);

  const handlePaymentSuccess = (txHash: string, voice: VoiceMetadata) => {
    if (onVoiceSelected) {
      onVoiceSelected(voice, txHash);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          No voices available yet. Be the first to register your voice!
          <br />
          <span className="text-xs text-muted-foreground mt-2 block">
            Note: This marketplace displays voices from known addresses. After registering,
            your voice will appear here automatically.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {voices.map((voice) => (
        <VoiceMarketplaceCard
          key={voice.owner}
          voice={voice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      ))}
    </div>
  );
}
