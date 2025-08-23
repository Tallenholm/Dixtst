import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Lightbulb, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Light } from "@shared/schema";

export default function ConnectedLights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lights = [], isLoading } = useQuery({
    queryKey: ['/api/lights'],
  });

  const updateLightMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Light> }) => {
      return fetchJson(`/api/lights/${id}/update`, {
        method: 'POST',
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
      toast({
        title: "Light updated",
        description: "Light settings have been applied successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update light settings.",
        variant: "destructive",
      });
    },
  });

  const handleLightUpdate = (lightId: string, updates: Partial<Light>) => {
    updateLightMutation.mutate({ id: lightId, updates });
  };

  if (isLoading) {
    return (
      <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getLightIcon = (light: Light) => {
    const colors = [
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-purple-500', 
      'from-green-400 to-teal-500',
      'from-pink-400 to-red-500'
    ];
    return colors[parseInt(light.id) % colors.length] || colors[0];
  };

  const getStatusColor = (light: Light) => {
    if (!light.isOn) return 'text-gray-400';
    if (light.manualOverride) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusText = (light: Light) => {
    if (!light.isOn) return 'Off';
    if (light.manualOverride) return 'Manual';
    return 'Auto';
  };

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Connected Lights</h3>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
          <Plus className="mr-2" size={16} />
          Add Light
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lights.map((light: Light) => (
          <div 
            key={light.id} 
            className={`bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 ${
              light.isOn ? 'light-glow' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getLightIcon(light)} flex items-center justify-center`}>
                  <Lightbulb className="text-white" size={16} />
                </div>
                <div>
                  <h4 className="font-medium">{light.name}</h4>
                  <p className="text-xs text-[--warm-gray]">
                    {light.isCircadianControlled ? 'Circadian Mode' : 'Manual Mode'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  light.isOn ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                <span className={`text-xs ${getStatusColor(light)}`}>
                  {getStatusText(light)}
                </span>
              </div>
            </div>
            
            {/* Brightness Slider */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-[--warm-gray] mb-2">
                <span>Brightness</span>
                <span>{Math.round((light.brightness || 0) / 254 * 100)}%</span>
              </div>
              <Slider
                value={[light.brightness || 0]}
                max={254}
                step={1}
                onValueChange={([value]) => 
                  handleLightUpdate(light.id, { brightness: value, isOn: value > 0 })
                }
                className="w-full"
              />
            </div>
            
            {/* Color Temperature */}
            <div>
              <div className="flex justify-between text-xs text-[--warm-gray] mb-2">
                <span>Temperature</span>
                <span>{light.colorTemp || '--'}K</span>
              </div>
              <Slider
                value={[light.colorTemp || 366]}
                min={153}
                max={500}
                step={1}
                onValueChange={([value]) => 
                  handleLightUpdate(light.id, { colorTemp: value })
                }
                className="w-full"
              />
            </div>
          </div>
        ))}
        
        {/* Add more lights placeholder */}
        <div className="bg-white/5 rounded-xl p-4 border border-dashed border-white/20 hover:border-white/30 transition-colors cursor-pointer flex items-center justify-center min-h-[120px]">
          <div className="text-center">
            <Plus className="text-2xl text-[--warm-gray] mb-2 mx-auto" size={24} />
            <p className="text-sm text-[--warm-gray]">Discover New Lights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
