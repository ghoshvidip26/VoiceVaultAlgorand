import { Mic, Brain, Shield, Coins, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice Cloning",
    description: "Upload your voice dataset and train a custom AI model that sounds exactly like you.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "AI-Powered TTS",
    description: "State-of-the-art text-to-speech technology generates natural, expressive audio.",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "On-Chain Ownership",
    description: "Your voice identity is minted on Aptos blockchain. Cryptographically proven ownership.",
    color: "primary",
  },
  {
    icon: Coins,
    title: "Pay-Per-Use Licensing",
    description: "Set your own pricing. Earn automatically every time someone generates audio with your voice.",
    color: "secondary",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Generate high-quality audio in seconds. No waiting, no queues, just results.",
    color: "primary",
  },
  {
    icon: Globe,
    title: "Global Marketplace",
    description: "Discover and license voices from creators worldwide. Find the perfect voice for any project.",
    color: "secondary",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            The Future of <span className="gradient-text">Voice Ownership</span>
          </h2>
          <p className="text-muted-foreground">
            A complete platform for creating, owning, and monetizing AI voice models with blockchain-verified identity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-6 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                feature.color === 'primary' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary/10 text-secondary'
              } group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
