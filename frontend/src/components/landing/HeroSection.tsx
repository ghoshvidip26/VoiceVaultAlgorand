import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroWaves from "@/assets/freq.mp4";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <video
          src={heroWaves}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <img src="/aptos.jpeg" alt="Aptos" className="h-5 w-5 rounded-full object-cover" />
            <span className="text-sm font-medium text-primary">Powered by Aptos and Shelby</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Own Your Voice.
            <br />
            <span className="gradient-text">Earn Forever.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Train custom AI voice models, mint on-chain ownership, and earn every time someone uses your voice for TTS generation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/upload">
              <Button variant="default" size="xl">
                Create Your Voice
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="glass" size="xl">
                <Play className="h-5 w-5" />
                Explore Voices
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">2.4K+</div>
              <div className="text-sm text-muted-foreground mt-1">Voice Models</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">$840K</div>
              <div className="text-sm text-muted-foreground mt-1">Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">12M+</div>
              <div className="text-sm text-muted-foreground mt-1">Audio Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
