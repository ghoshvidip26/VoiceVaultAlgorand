import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAlgorandWallet, getAccountBalance as getAlgorandAccountBalance } from "@/hooks/useAlgorandWallet";
import { truncateAddress } from "@/lib/algorand";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Create Voice" },
  { href: "/deploy", label: "Deploy" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect } = useAlgorandWallet();
  const [algoBalance, setAlgoBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBalance() {
      const addr = address?.toString();
      if (!addr) {
        setAlgoBalance(null);
        return;
      }
      try {
        const balance = await getAlgorandAccountBalance(addr);
        if (!cancelled) {
          setAlgoBalance(balance);
        }
      } catch {
        if (!cancelled) {
          setAlgoBalance(null);
        }
      }
    }

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const handleWalletClick = async () => {
    try {
      if (isConnected) {
        await disconnect();
        return;
      }

      await connect();
    } catch (err) {
      console.error("Wallet connect/disconnect error:", err);
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] md:w-[88%] lg:w-[82%]">
      <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
        <div className="px-6 md:px-8 flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-all duration-300" />
              <img
                src="/logo.png"
                alt="V3 Labs Logo"
                className="relative h-10 w-10 rounded-full object-cover"
              />
            </div>
            <span className="font-display text-xl font-bold gradient-text">
              VoiceVault
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-7">
            {address && algoBalance !== null && (
              <div className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                {algoBalance.toFixed(3)} ALGO
              </div>
            )}
            <Button variant="default" onClick={handleWalletClick}>
              {isConnected && address
                ? truncateAddress(address.toString(), 6)
                : "Connect Pera"}
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 bg-black/40 backdrop-blur-xl rounded-b-2xl">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex items-center justify-center px-4">
                <Button variant="default" onClick={handleWalletClick} className="w-full">
                  {isConnected && address
                    ? truncateAddress(address.toString(), 6)
                    : "Connect Pera"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
