import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LocationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: location } = useQuery({
    queryKey: ['/api/location'],
  });

  const { data: sunTimes } = useQuery({
    queryKey: ['/api/schedule/sun-times'],
  });

  const detectLocationMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/location/detect', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule/sun-times'] });
      toast({
        title: "Location updated",
        description: "Your location has been detected and updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Location detection failed",
        description: "Unable to detect your current location.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">Location & Time</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[--warm-gray] mb-2">Current Location</label>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="text-[--circadian-amber]" size={16} />
            <span>{location ? `${location.city}, ${location.country}` : 'Loading...'}</span>
          </div>
          {location && (
            <div className="text-xs text-[--warm-gray] mt-1">
              {location.latitude.toFixed(4)}° N, {Math.abs(location.longitude).toFixed(4)}° W
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-[--warm-gray] mb-1">Sunrise</div>
            <div className="text-lg font-semibold text-orange-400">
              {sunTimes?.sunrise || '6:32'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-[--warm-gray] mb-1">Sunset</div>
            <div className="text-lg font-semibold text-orange-400">
              {sunTimes?.sunset || '19:45'}
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => detectLocationMutation.mutate()}
          disabled={detectLocationMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw 
            className={`mr-2 ${detectLocationMutation.isPending ? 'animate-spin' : ''}`} 
            size={16} 
          />
          Update Location
        </Button>
      </div>
    </div>
  );
}
