/**
 * Complete Integration Example
 * 
 * This component demonstrates the full flow:
 * 1. Connect wallet
 * 2. Register voice
 * 3. View marketplace
 * 4. Pay for voice
 * 5. Generate TTS
 */

import { useState } from "react";
import { useAptosWallet } from "@/hooks/useAptosWallet";
import { useVoiceRegister } from "@/hooks/useVoiceRegister";
import { useVoiceMetadata } from "@/hooks/useVoiceMetadata";
import { usePayForInference } from "@/hooks/usePayForInference";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, CheckCircle2, Play } from "lucide-react";
import { toast } from "sonner";
import { formatAddress } from "@/lib/aptos";

export function CompleteIntegrationExample() {
  const { connect, disconnect, isConnected, address } = useAptosWallet();
  const { registerVoice, isRegistering } = useVoiceRegister();
  const { payForInference, isPaying } = usePayForInference();

  // Registration form state
  const [voiceName, setVoiceName] = useState("");
  const [modelUri, setModelUri] = useState("openai:alloy");
  const [rights, setRights] = useState("commercial");
  const [pricePerUse, setPricePerUse] = useState("0.1");

  // Marketplace state
  const [selectedVoiceAddress, setSelectedVoiceAddress] = useState("");
  const { metadata: selectedVoice } = useVoiceMetadata(selectedVoiceAddress);

  // TTS state
  const [ttsText, setTtsText] = useState("");

  const handleRegister = async () => {
    const result = await registerVoice({
      name: voiceName,
      modelUri,
      rights,
      pricePerUse: parseFloat(pricePerUse),
    });

    if (result?.success) {
      toast.success("Voice registered successfully!");
      setVoiceName("");
      setModelUri("openai:alloy");
    }
  };

  const handlePayAndGenerate = async () => {
    if (!selectedVoice) {
      toast.error("Please select a voice first");
      return;
    }

    const result = await payForInference({
      creatorAddress: selectedVoice.owner,
      amount: selectedVoice.pricePerUse,
      royaltyRecipient: selectedVoice.owner,
      onSuccess: async (txHash) => {
        toast.success("Payment successful! Generating audio...");
        // Here you would trigger TTS generation
      },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Tabs defaultValue="connect" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connect">1. Connect</TabsTrigger>
          <TabsTrigger value="register">2. Register</TabsTrigger>
          <TabsTrigger value="marketplace">3. Browse</TabsTrigger>
          <TabsTrigger value="use">4. Use Voice</TabsTrigger>
        </TabsList>

        {/* Step 1: Connect Wallet */}
        <TabsContent value="connect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your Aptos wallet to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Button onClick={() => connect("Petra")} className="w-full" size="lg">
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        {formatAddress(address?.toString() || "")}
                      </p>
                    </div>
                  </div>
                  <Button onClick={disconnect} variant="outline" className="w-full">
                    Disconnect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Register Voice */}
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register Your Voice</CardTitle>
              <CardDescription>
                Register your voice model on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice-name">Voice Name</Label>
                <Input
                  id="voice-name"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., Alex Sterling"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-uri">Model URI</Label>
                <Input
                  id="model-uri"
                  value={modelUri}
                  onChange={(e) => setModelUri(e.target.value)}
                  placeholder="e.g., openai:alloy or ipfs://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rights">Usage Rights</Label>
                <Input
                  id="rights"
                  value={rights}
                  onChange={(e) => setRights(e.target.value)}
                  placeholder="e.g., commercial, personal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price Per Use (APT)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={pricePerUse}
                  onChange={(e) => setPricePerUse(e.target.value)}
                  placeholder="0.1"
                />
              </div>

              <Button
                onClick={handleRegister}
                disabled={isRegistering || !isConnected}
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Voice"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Browse Marketplace */}
        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse Voices</CardTitle>
              <CardDescription>
                Select a voice to use (enter owner address)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice-address">Voice Owner Address</Label>
                <Input
                  id="voice-address"
                  value={selectedVoiceAddress}
                  onChange={(e) => setSelectedVoiceAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              {selectedVoice && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">{selectedVoice.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Price: {selectedVoice.pricePerUse} APT
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rights: {selectedVoice.rights}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Model: {selectedVoice.modelUri}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Use Voice */}
        <TabsContent value="use" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Speech</CardTitle>
              <CardDescription>
                Pay for the voice and generate audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tts-text">Text to Generate</Label>
                <Input
                  id="tts-text"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Enter text to convert to speech..."
                />
              </div>

              <Button
                onClick={handlePayAndGenerate}
                disabled={isPaying || !selectedVoice || !ttsText}
                className="w-full"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Pay & Generate ({selectedVoice?.pricePerUse || 0} APT)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}