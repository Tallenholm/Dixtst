import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Progress component not available, we'll use a custom one
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-[--circadian-amber] h-2 rounded-full transition-all duration-300" 
      style={{ width: `${value}%` }}
    />
  </div>
);
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Wifi, CheckCircle, AlertCircle, Link as LinkIcon } from "lucide-react";
import { Link, useLocation } from "wouter";

interface Bridge {
  id?: string;
  name: string;
  ip: string;
  isConnected?: boolean;
  username?: string;
}

export default function BridgeSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pairingProgress, setPairingProgress] = useState(0);
  const [isPairing, setIsPairing] = useState(false);

  const { data: bridges, isLoading: bridgesLoading, refetch: refetchBridges } = useQuery<Bridge[]>({
    queryKey: ['/api/bridges'],
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/bridges/discover', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      refetchBridges();
      toast({
        title: "Discovery Complete",
        description: "Found Philips Hue bridges on your network.",
      });
    },
    onError: () => {
      toast({
        title: "Discovery Failed",
        description: "Could not find any Hue bridges. Make sure they're connected to your network.",
        variant: "destructive",
      });
    },
  });

  const pairMutation = useMutation({
    mutationFn: async (bridgeId: string) => {
      return apiRequest(`/api/bridges/${bridgeId}/pair`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setIsPairing(false);
      setPairingProgress(0);
      refetchBridges();
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
      toast({
        title: "Bridge Paired Successfully",
        description: "Your Hue bridge is now connected! Discovering lights...",
      });
      // Redirect to dashboard after successful pairing
      setTimeout(() => setLocation('/'), 2000);
    },
    onError: () => {
      setIsPairing(false);
      setPairingProgress(0);
      toast({
        title: "Pairing Failed",
        description: "Make sure you pressed the button on your Hue bridge and try again.",
        variant: "destructive",
      });
    },
  });

  const handlePairBridge = (bridge: Bridge) => {
    setIsPairing(true);
    
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setPairingProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 500);

    // Start the actual pairing process
    pairMutation.mutate(bridge.ip);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--deep-navy] via-[--midnight-blue] to-black text-white">
      <header className="border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-[--circadian-amber]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[--circadian-amber] to-orange-400 bg-clip-text text-transparent">
                Bridge Setup
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Setup Instructions */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-[--circadian-amber]" />
                <span>Connect Your Philips Hue Bridge</span>
              </CardTitle>
              <CardDescription>
                Follow these steps to connect your Hue bridge to the Circadian Hue system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[--circadian-amber] text-black rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Ensure Bridge is Connected</h3>
                    <p className="text-gray-400 text-sm">
                      Make sure your Philips Hue bridge is connected to the same network as this device.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[--circadian-amber] text-black rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Discover Bridges</h3>
                    <p className="text-gray-400 text-sm">
                      Click "Discover Bridges" to scan your network for Hue bridges.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[--circadian-amber] text-black rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Press Bridge Button</h3>
                    <p className="text-gray-400 text-sm">
                      When prompted, press the large button on top of your Hue bridge, then click "Pair Bridge".
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discovery Section */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Bridge Discovery</span>
                <Button
                  onClick={() => discoverMutation.mutate()}
                  disabled={discoverMutation.isPending}
                  className="bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {discoverMutation.isPending ? 'Discovering...' : 'Discover Bridges'}
                </Button>
              </CardTitle>
              <CardDescription>
                Scan your network for available Philips Hue bridges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bridgesLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--circadian-amber] mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading bridges...</p>
                </div>
              )}

              {!bridgesLoading && bridges && bridges.length === 0 && (
                <Alert className="border-gray-600 bg-gray-800/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-gray-300">
                    No bridges found. Make sure your Hue bridge is connected to the network and try discovering again.
                  </AlertDescription>
                </Alert>
              )}

              {!bridgesLoading && bridges && bridges.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Found {bridges.length} bridge{bridges.length === 1 ? '' : 's'} on your network:
                  </p>
                  
                  {bridges.map((bridge, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-600">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <Wifi className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{bridge.name}</h3>
                              <p className="text-sm text-gray-400">IP: {bridge.ip}</p>
                              {bridge.isConnected && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="text-sm text-green-400">Connected</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            {!bridge.isConnected && (
                              <Button
                                onClick={() => handlePairBridge(bridge)}
                                disabled={isPairing}
                                className="bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black"
                              >
                                {isPairing ? 'Pairing...' : 'Pair Bridge'}
                              </Button>
                            )}
                            
                            {bridge.isConnected && (
                              <div className="text-right">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="text-sm text-green-400">Ready</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isPairing && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                              <span>Pairing in progress...</span>
                              <span>{pairingProgress}%</span>
                            </div>
                            <Progress value={pairingProgress} className="h-2" />
                            <Alert className="border-[--circadian-amber]/30 bg-[--circadian-amber]/10 mt-3">
                              <AlertCircle className="h-4 w-4 text-[--circadian-amber]" />
                              <AlertDescription className="text-[--circadian-amber]">
                                Press the button on your Hue bridge now to complete pairing.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-400">
              <div>
                <h4 className="font-medium text-white mb-1">Bridge not found?</h4>
                <p>Ensure your Hue bridge is powered on and connected to the same network. Try restarting your bridge and router.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Pairing failed?</h4>
                <p>Make sure you press the bridge button within 30 seconds of clicking "Pair Bridge". The button should light up when pressed.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Still having issues?</h4>
                <p>Check that your bridge firmware is up to date using the official Philips Hue app.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}