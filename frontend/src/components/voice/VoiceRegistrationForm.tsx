import { useState, useEffect } from "react";
import { useVoiceRegister } from "@/hooks/useVoiceRegister";
import { useVoiceUnregister } from "@/hooks/useVoiceUnregister";
import { useAptosWallet } from "@/hooks/useAptosWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addVoiceToRegistry, removeVoiceFromRegistry } from "@/lib/voiceRegistry";
import { useVoiceMetadata } from "@/hooks/useVoiceMetadata";
import { isShelbyUri, parseShelbyUri } from "@/lib/shelby";

interface VoiceRegistrationFormProps {
  autoName?: string;
  autoModelUri?: string;
}

export function VoiceRegistrationForm({ autoName = "", autoModelUri = "" }: VoiceRegistrationFormProps) {
  const { registerVoice, isRegistering } = useVoiceRegister();
  const { unregisterVoice, isUnregistering } = useVoiceUnregister();
  const { address, isConnected } = useAptosWallet();
  const [formData, setFormData] = useState({
    name: autoName,
    modelUri: autoModelUri,
    rights: "commercial",
    pricePerUse: "0.1",
  });

  // Check if user already has a registered voice (fetched from blockchain)
  const { metadata: existingVoice, isLoading: checkingVoice } = useVoiceMetadata(address?.toString() || null);

  // Update form when auto-fill values change
  useEffect(() => {
    if (autoName) setFormData(prev => ({ ...prev, name: autoName }));
    if (autoModelUri) setFormData(prev => ({ ...prev, modelUri: autoModelUri }));
  }, [autoName, autoModelUri]);


  // Note: useVoiceMetadata hook automatically checks if voice exists when address changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if voice already exists (one voice per creator limitation from contract)
    if (existingVoice) {
      toast.error("You already have a registered voice. Only one voice per wallet address is allowed.", {
        description: `Existing voice: ${existingVoice.name}`,
        duration: 5000,
      });
      return;
    }

    // Validate required fields according to contract
    if (!formData.name.trim()) {
      toast.error("Voice name is required");
      return;
    }

    if (!formData.modelUri.trim()) {
      toast.error("Model URI is required. Please enter a Shelby URI", {
        description: "If you processed your voice model above, the Shelby URI should be auto-filled",
      });
      return;
    }

    // Validate that the URI is a Shelby URI
    if (!isShelbyUri(formData.modelUri.trim())) {
      toast.error("Invalid model URI format", {
        description: "Only Shelby URIs are accepted (format: shelby://<account>/<namespace>/<voice_id>)",
      });
      return;
    }

    // Validate that the Shelby URI matches the connected wallet address
    const parsedUri = parseShelbyUri(formData.modelUri.trim());
    if (parsedUri && address && parsedUri.account.toLowerCase() !== address.toString().toLowerCase()) {
      toast.error("URI account mismatch", {
        description: "The Shelby URI must belong to your connected wallet address",
      });
      return;
    }

    const price = parseFloat(formData.pricePerUse);
    if (isNaN(price) || price <= 0) {
      toast.error("Price per use must be greater than 0");
      return;
    }

    if (!formData.rights.trim()) {
      toast.error("Usage rights are required");
      return;
    }

    // Double-check voice doesn't exist (race condition prevention)
    // Contract will reject with ERROR_VOICE_ALREADY_EXISTS if it exists anyway

    // Register voice on-chain (contract handles all validation)
    toast.info("Registering voice on Aptos blockchain...");
    const result = await registerVoice({
      name: formData.name.trim(),
      modelUri: formData.modelUri.trim(),
      rights: formData.rights.trim(),
      pricePerUse: price,
    });

    if (result?.success) {
      // Add to local voice registry for marketplace discovery
      addVoiceToRegistry(address.toString(), formData.name);
      
      // Reset form
      setFormData({
        name: "",
        modelUri: "",
        rights: "commercial",
        pricePerUse: "0.1",
      });
      
      toast.success("Voice registered on-chain successfully!", {
        description: `Transaction: ${result.transactionHash.slice(0, 8)}...${result.transactionHash.slice(-6)}`,
        duration: 7000,
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(`https://explorer.aptoslabs.com/txn/${result.transactionHash}?network=testnet`, '_blank');
          },
        },
      });

      // Refresh the page after a delay to show the new registration
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleDelete = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!existingVoice) {
      toast.error("No voice found to delete");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete your voice "${existingVoice.name}"? This action cannot be undone and will remove your voice from the blockchain and Shelby storage.`
    );

    if (!confirmed) {
      return;
    }

    toast.info("Deleting voice on Aptos blockchain...");
    const result = await unregisterVoice();

    if (result?.success) {
      // Remove from local voice registry
      removeVoiceFromRegistry(address.toString());
      
      // Delete from Shelby storage if it's a Shelby URI
      if (existingVoice.modelUri && existingVoice.modelUri.startsWith("shelby://")) {
        try {
          toast.info("Deleting voice from Shelby storage...");
          const { backendApi } = await import("@/lib/api");
          await backendApi.deleteFromShelby(existingVoice.modelUri, address.toString());
          toast.success("Voice deleted from Shelby storage");
        } catch (err: any) {
          console.error("Error deleting from Shelby:", err);
          // Don't fail the whole operation if Shelby deletion fails
          // The on-chain deletion was successful, which is the most important part
          toast.warning("Voice deleted on-chain, but Shelby deletion failed", {
            description: err.message || "Voice files may still exist in storage",
          });
        }
      }
      
      toast.success("Voice deleted successfully!", {
        description: `Transaction: ${result.transactionHash.slice(0, 8)}...${result.transactionHash.slice(-6)}`,
        duration: 7000,
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(`https://explorer.aptoslabs.com/txn/${result.transactionHash}?network=testnet`, '_blank');
          },
        },
      });

      // Refresh the page after a delay to show the deletion
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Show warning if voice already exists
  if (existingVoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Already Registered</CardTitle>
          <CardDescription>
            You already have a voice registered on-chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Voice Name:</strong> {existingVoice.name}
                </p>
                <p>
                  <strong>Voice ID:</strong> {existingVoice.voiceId}
                </p>
                <p>
                  <strong>Model URI:</strong> {existingVoice.modelUri}
                </p>
                <p>
                  <strong>Price:</strong> {existingVoice.pricePerUse} APT per use
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The contract allows only one voice per wallet address. You can delete this voice to register a new one.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isUnregistering || !isConnected}
            className="w-full"
          >
            {isUnregistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Voice...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Voice
              </>
            )}
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Warning:</strong> Deleting your voice will permanently remove it from the blockchain. 
              You will need to sign a transaction with your wallet to confirm the deletion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Your Voice on-Chain</CardTitle>
        <CardDescription>
          Register your voice model on Aptos blockchain to start earning. Only one voice per wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to register a voice on-chain
            </AlertDescription>
          </Alert>
        )}

        {checkingVoice && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Checking if you already have a registered voice on-chain...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Voice Name</Label>
            <Input
              id="name"
              placeholder="e.g., Alex Sterling"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelUri">
              Model URI <span className="text-red-500">*</span>
            </Label>
            <Input
              id="modelUri"
              placeholder=""
              value={formData.modelUri}
              onChange={(e) => setFormData({ ...formData, modelUri: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Required. Enter the Shelby URI for your voice model. If you processed your voice above, this should be auto-filled.
              <br />
              Format: <code className="text-xs">shelby://&lt;aptos_account&gt;/voices/&lt;voice_id&gt;</code>
              <br />
              Only Shelby URIs are accepted. Process your voice model in Step 2 to get a Shelby URI.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights">
              Usage Rights <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rights"
              placeholder="e.g., commercial, personal, limited"
              value={formData.rights}
              onChange={(e) => setFormData({ ...formData, rights: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Specify the usage rights for your voice (e.g., "commercial", "personal", "limited")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              Price Per Use (APT) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0.1"
              value={formData.pricePerUse}
              onChange={(e) => setFormData({ ...formData, pricePerUse: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Set the price per use in APT. Must be greater than 0.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> This will register your voice on Aptos blockchain. 
              Only one voice per wallet address is allowed. You will need to sign a transaction with your wallet.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            disabled={isRegistering || !isConnected || checkingVoice} 
            className="w-full"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering on Blockchain...
              </>
            ) : checkingVoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : !isConnected ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Connect Wallet First
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Register Voice on Blockchain
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
