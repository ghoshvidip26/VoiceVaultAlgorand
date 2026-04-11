import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { ReactNode } from "react";
import { useWallet } from "@/hooks/use-wallet";

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { connected } = useWallet();

    if (!connected) {
        return (
            <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Wallet Connection Required</CardTitle>
                        <CardDescription className="text-gray-400">
                            Please connect your wallet to access this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-sm text-gray-500 text-center">
                                You need to connect your wallet to view your dashboard, upload voices, or trade in the marketplace.
                            </p>
                            {/* WalletConnectButton returns null if connected, which is fine here since we are in the !connected block.
                    However, it might rely on being inside the provider (which we are). 
                    The button itself handles the click.
                */}
                            <WalletConnectButton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
};
