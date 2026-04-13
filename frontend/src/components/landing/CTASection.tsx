import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="glass-card max-w-4xl mx-auto p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative gradient border effect */}
          <div className="absolute inset-0 rounded-xl p-px bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
          <div className="absolute inset-px rounded-xl bg-card" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Limited Early Access</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Own Your <span className="gradient-text">Voice Identity</span>?
            </h2>

            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of creators already earning from their AI voice clones. Connect your wallet and start building your voice empire today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button variant="gradient" size="xl">
                  Start Creating
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
