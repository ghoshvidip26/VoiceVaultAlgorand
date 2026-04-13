import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { Sparkles } from "lucide-react";

const Deploy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Deploy - VoiceVault</title></Helmet>
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Deploy
              </CardTitle>
              <CardDescription>
                Deploy your voice agents on-chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  v2 Coming Soon!
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  v2 coming with V3 Labs giving you access to deploy your own voice agents onchain!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Deploy;

