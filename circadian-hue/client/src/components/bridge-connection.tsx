import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Wifi, Search, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bridge } from "@shared/types";
import { useEffect, useState } from "react";

export default function BridgeConnection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bridges = [] } = useQuery<Bridge[]>({
    queryKey: ['/api/bridges'],
  });

  const [selectedBridgeId, setSelectedBridgeId] = useState<string>("");

  useEffect(() => {
    if (!selectedBridgeId && bridges.length > 0) {
      setSelectedBridgeId(bridges[0].id);
    }
  }, [bridges, selectedBridgeId]);

  const { data: lights = [] } = useQuery({
    queryKey: ['/api/lights'],
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/bridges/discover', { method: 'POST' });
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
      return fetchJson(`/api/bridges/${bridgeId}/pair`, { method: 'POST' });
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

  const connectedBridge: Bridge | undefined = bridges.find(
    (bridge: Bridge) => bridge.isConnected
  );

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
            <>
              {bridges.length > 1 && (
                <select
                  className="flex-1 bg-gray-700 text-white text-sm rounded-md px-2 mr-2"
                  value={selectedBridgeId}
                  onChange={(e) => setSelectedBridgeId(e.target.value)}
                >
                  {bridges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-gray-700 hover:bg-gray-600"
                onClick={() => selectedBridgeId && pairMutation.mutate(selectedBridgeId)}
                disabled={pairMutation.isPending || !selectedBridgeId}
              >
                <Link className="mr-1" size={14} />
                Pair
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
