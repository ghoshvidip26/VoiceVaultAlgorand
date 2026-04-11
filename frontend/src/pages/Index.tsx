import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>VoiceVault - Own Your Voice, Earn Forever | AI Voice Cloning Platform</title>
        <meta name="description" content="Create custom AI voice models, mint on-chain ownership on Aptos blockchain, and earn every time someone uses your voice for TTS generation." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
