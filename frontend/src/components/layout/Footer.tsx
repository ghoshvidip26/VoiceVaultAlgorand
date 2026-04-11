import { Link } from "react-router-dom";
import { Mic2, Twitter, Github, MessageCircle } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Create Voice", href: "/upload" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "License Agreement", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://x.com/V3Labz", label: "Twitter" },
  { icon: Github, href: "https://github.com/rajarshidattapy/voice_vault", label: "GitHub" }
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/aptos.jpeg" 
                alt="Aptos Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-display text-xl font-bold gradient-text">VoiceVault</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Decentralized voice identity platform. Own your voice, set your price, earn from every use.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Built at Build on Aptos, Bangalore, 2025
          </p>
          <p className="text-sm text-muted-foreground">
            Built on <span className="text-primary">Aptos</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
