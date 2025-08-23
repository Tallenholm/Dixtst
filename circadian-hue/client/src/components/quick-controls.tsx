import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sun, Flame, Moon, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function QuickControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [manualOverride, setManualOverride] = useState(false);

  const presetMutation = useMutation({
    mutationFn: async (preset: string) => {
      return fetchJson(`/api/lights/preset/${preset}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
      toast({
        title: "Preset applied",
        description: "Light preset has been applied successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Preset failed",
        description: "Failed to apply light preset.",
        variant: "destructive",
      });
    },
  });

  const presets = [
    {
      id: 'focus',
      name: 'Focus Mode',
      description: 'Bright, cool light',
      icon: Sun,
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'cozy',
      name: 'Cozy Evening',
      description: 'Warm, dim light',
      icon: Flame,
      gradient: 'from-orange-400 to-red-500'
    },
    {
      id: 'sleep',
      name: 'Sleep Time',
      description: 'Very warm, minimal',
      icon: Moon,
      gradient: 'from-purple-400 to-indigo-500'
    },
    {
      id: 'off',
      name: 'All Off',
      description: 'Turn off all lights',
      icon: Power,
      gradient: 'from-gray-400 to-gray-600'
    }
  ];

  const handlePreset = (presetId: string) => {
    presetMutation.mutate(presetId);
  };

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">Quick Controls</h3>
      
      {/* Manual Override Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">Manual Override</span>
          <Switch 
            checked={manualOverride} 
            onCheckedChange={setManualOverride}
          />
        </div>
        <p className="text-xs text-[--warm-gray]">Temporarily disable automatic adjustments</p>
      </div>
      
      {/* Quick Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[--warm-gray]">Quick Presets</h4>
        
        {presets.map((preset) => {
          const IconComponent = preset.icon;
          return (
            <Button
              key={preset.id}
              variant="ghost"
              className="w-full justify-start p-3 h-auto bg-white/5 hover:bg-white/10 border border-white/10"
              onClick={() => handlePreset(preset.id)}
              disabled={presetMutation.isPending}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${preset.gradient} flex items-center justify-center`}>
                  <IconComponent className="text-white" size={16} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-[--warm-gray]">{preset.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}


export function FunBar({ roomId }:{ roomId?: string }){
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <VibeDice roomId={roomId} />
      {roomId && <MusicControl roomId={roomId} />}
      <SleepControls />
    </div>
  )
}
