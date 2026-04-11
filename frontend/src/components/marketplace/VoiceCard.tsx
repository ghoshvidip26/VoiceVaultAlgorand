import { Button } from "@/components/ui/button";
import { Play, Pause, DollarSign, Clock, Star } from "lucide-react";
import { useState } from "react";

interface VoiceCardProps {
  voice: {
    id: string;
    name: string;
    creator: string;
    avatar: string;
    pricePerUse: number;
    totalUses: number;
    rating: number;
    tags: string[];
    sampleUrl?: string;
  };
  onSelect?: (id: string) => void;
}

export function VoiceCard({ voice, onSelect }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    // Audio playback would go here
  };

  return (
    <div
      className="glass-card-hover p-4 cursor-pointer group"
      onClick={() => onSelect?.(voice.id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative">
          <img
            src={voice.avatar}
            alt={voice.name}
            className="w-14 h-14 rounded-xl object-cover border border-border/50"
          />
          <button
            onClick={handlePlay}
            className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {voice.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">by {voice.creator}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {voice.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-primary">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold">{voice.pricePerUse}</span>
          <span className="text-muted-foreground">APT/use</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{voice.totalUses.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span>{voice.rating}</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <Button variant="glass" size="sm" className="w-full mt-4">
        Use Voice
      </Button>
    </div>
  );
}
