import { Upload, Cpu, Link2, DollarSign, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Voice Dataset",
    description: "Record or upload audio samples of your voice. 10-30 minutes of clean audio works best.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Train AI Model",
    description: "Our AI processes your audio and trains a custom voice model that captures your unique sound.",
  },
  {
    step: "03",
    icon: Link2,
    title: "Mint On-Chain",
    description: "Your voice identity is minted on Aptos blockchain, creating permanent ownership proof.",
  },
  {
    step: "04",
    icon: DollarSign,
    title: "Earn Per Use",
    description: "Set your pricing and earn automatically whenever someone generates audio with your voice.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How <span className="gradient-text">VoiceVault</span> Works
          </h2>
          <p className="text-muted-foreground">
            From upload to earning in four simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-secondary/20 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="glass-card p-6 text-center relative z-10 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border border-primary/30">
                    <span className="font-display text-sm font-bold text-primary">{step.step}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4 mt-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
