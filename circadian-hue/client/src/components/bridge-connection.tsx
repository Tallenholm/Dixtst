import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Wifi, Search, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BridgeConnection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bridges = [] } = useQuery({
    queryKey: ['/api/bridges'],
  });

  const { data: lights = [] } = useQuery({
    queryKey: ['/api/lights'],
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/bridges/discover');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bridges'] });
      toast({
        title: "Bridge discovery complete",
        description: "Scanning for Hue bridges on your network.",
      });
    },
    onError: () => {
      toast({
        title: "Discovery failed",
        description: "Unable to discover bridges on your network.",
        variant: "destructive",
      });
    },
  });

  const pairMutation = useMutation({
    mutationFn: async (bridgeId: string) => {
      const response = await apiRequest('POST', `/api/bridges/${bridgeId}/pair`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bridges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
      toast({
        title: "Bridge paired successfully",
        description: "Your Hue bridge is now connected.",
      });
    },
    onError: () => {
      toast({
        title: "Pairing failed",
        description: "Please press the button on your Hue bridge and try again.",
        variant: "destructive",
      });
    },
  });

  const connectedBridge = bridges.find((bridge: any) => bridge.isConnected);

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">Hue Bridge</h3>
      
      <div className="space-y-4">
        {connectedBridge ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center border border-gray-500">
                  <Wifi className="text-green-400" size={20} />
                </div>
                <div>
                  <div className="font-medium text-sm">{connectedBridge.name}</div>
                  <div className="text-xs text-green-400">Connected</div>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="text-xs text-[--warm-gray] space-y-1">
              <div>IP: <span>{connectedBridge.ip}</span></div>
              <div>API Version: <span>{connectedBridge.apiVersion}</span></div>
              <div>Lights Found: <span>{lights.length}</span></div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Wifi className="text-gray-400" size={20} />
            </div>
            <p className="text-sm text-[--warm-gray] mb-4">No bridge connected</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 bg-gray-700 hover:bg-gray-600"
            onClick={() => discoverMutation.mutate()}
            disabled={discoverMutation.isPending}
          >
            <Search className="mr-1" size={14} />
            Scan
          </Button>
          {bridges.length > 0 && !connectedBridge && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 bg-gray-700 hover:bg-gray-600"
              onClick={() => pairMutation.mutate(bridges[0].id)}
              disabled={pairMutation.isPending}
            >
              <Link className="mr-1" size={14} />
              Pair
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
