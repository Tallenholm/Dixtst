import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Waves,
  RotateCw,
  Heart,
  Rainbow,
  Flame,
  Snowflake,
  Music,
  Timer,
  Play,
  Pause,
  Square
} from "lucide-react";

interface EffectSettings {
  speed: number;
  intensity: number;
  duration?: number;
  colors?: string[];
}

interface LightingEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ambient' | 'dynamic' | 'therapeutic' | 'entertainment';
  duration?: number;
  settings: EffectSettings & { colors: string[] };
}

const LIGHTING_EFFECTS: LightingEffect[] = [
  {
    id: 'breathing',
    name: 'Breathing',
    description: 'Gentle fade in/out for relaxation',
    icon: 'Waves',
    category: 'therapeutic',
    duration: 300, // 5 minutes
    settings: { speed: 3, intensity: 70, colors: ['warm'] }
  },
  {
    id: 'rainbow-cycle',
    name: 'Rainbow Cycle',
    description: 'Smooth color transitions through spectrum',
    icon: 'Rainbow',
    category: 'entertainment',
    settings: { speed: 5, intensity: 80, colors: ['rainbow'] }
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Warm flickering like a cozy fire',
    icon: 'Flame',
    category: 'ambient',
    settings: { speed: 7, intensity: 60, colors: ['orange', 'red', 'yellow'] }
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Cool blue waves for tranquility',
    icon: 'Waves',
    category: 'therapeutic',
    settings: { speed: 4, intensity: 50, colors: ['blue', 'cyan', 'teal'] }
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    description: 'Aurora-like green and purple dance',
    icon: 'Snowflake',
    category: 'ambient',
    settings: { speed: 2, intensity: 85, colors: ['green', 'purple', 'blue'] }
  },
  {
    id: 'party-pulse',
    name: 'Party Pulse',
    description: 'High-energy synchronized flashing',
    icon: 'Music',
    category: 'entertainment',
    settings: { speed: 9, intensity: 100, colors: ['rainbow'] }
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: 'Ultra-slow purple breathing for deep focus',
    icon: 'Heart',
    category: 'therapeutic',
    duration: 600, // 10 minutes
    settings: { speed: 1, intensity: 30, colors: ['purple'] }
  },
  {
    id: 'sunrise-sim',
    name: 'Sunrise Simulation',
    description: 'Natural awakening light progression',
    icon: 'RotateCw',
    category: 'therapeutic',
    duration: 1800, // 30 minutes
    settings: { speed: 1, intensity: 100, colors: ['red', 'orange', 'yellow', 'white'] }
  }
];

const getIcon = (iconName: string) => {
  const icons = { Zap, Waves, RotateCw, Heart, Rainbow, Flame, Snowflake, Music, Timer };
  const IconComponent = icons[iconName as keyof typeof icons] || Zap;
  return IconComponent;
};

const getCategoryColor = (category: string) => {
  const colors = {
    ambient: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    dynamic: 'bg-green-500/20 text-green-400 border-green-500/50',
    therapeutic: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    entertainment: 'bg-pink-500/20 text-pink-400 border-pink-500/50'
  };
  return colors[category as keyof typeof colors] || colors.ambient;
};

export default function AdvancedLightingEffects() {
  const { toast } = useToast();
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [effectSettings, setEffectSettings] = useState<EffectSettings>({
    speed: 5,
    intensity: 80,
    duration: 5,
  });
  const [isCustomMode, setIsCustomMode] = useState(false);

  const startEffectMutation = useMutation({
    mutationFn: async ({ effectId, settings }: { effectId: string; settings: EffectSettings }) => {
      return apiRequest('/api/effects/start', 'POST', { effectId, settings });
    },
    onSuccess: (_, { effectId }) => {
      setActiveEffect(effectId);
      const effect = LIGHTING_EFFECTS.find(e => e.id === effectId);
      toast({
        title: `${effect?.name} Started`,
        description: effect?.description,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
    },
  });

  const stopEffectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/effects/stop', 'POST', {});
    },
    onSuccess: () => {
      setActiveEffect(null);
      toast({
        title: "Effect Stopped",
        description: "Returned to circadian mode.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
    },
  });

  const handleStartEffect = (effect: LightingEffect) => {
    const settings: EffectSettings = isCustomMode ? {
      speed: effectSettings.speed,
      intensity: effectSettings.intensity,
      duration: effectSettings.duration ? effectSettings.duration * 60 : undefined,
      colors: effect.settings.colors
    } : effect.settings;

    startEffectMutation.mutate({ effectId: effect.id, settings });
  };

  const groupedEffects = LIGHTING_EFFECTS.reduce((acc, effect) => {
    if (!acc[effect.category]) {
      acc[effect.category] = [];
    }
    acc[effect.category].push(effect);
    return acc;
  }, {} as Record<string, LightingEffect[]>);

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <span>Lighting Effects</span>
          </div>
          {activeEffect && (
            <Button
              onClick={() => stopEffectMutation.mutate()}
              disabled={stopEffectMutation.isPending}
              size="sm"
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="presets" className="data-[state=active]:bg-[--circadian-amber] data-[state=active]:text-black">
              Presets
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-[--circadian-amber] data-[state=active]:text-black">
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4 mt-4">
            {Object.entries(groupedEffects).map(([category, effects]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Label>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {effects.map((effect) => {
                    const IconComponent = getIcon(effect.icon);
                    const isActive = activeEffect === effect.id;
                    
                    return (
                      <Button
                        key={effect.id}
                        onClick={() => handleStartEffect(effect)}
                        disabled={startEffectMutation.isPending}
                        variant="outline"
                        className={`
                          h-auto p-3 justify-start text-left
                          ${isActive 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-white'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isActive ? 'bg-purple-600/30' : 'bg-gray-700'}
                          `}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{effect.name}</div>
                            <div className={`text-xs ${isActive ? 'text-purple-300/70' : 'text-gray-400'}`}>
                              {effect.description}
                            </div>
                            {effect.duration && (
                              <div className={`text-xs mt-1 ${isActive ? 'text-purple-300/70' : 'text-gray-500'}`}>
                                Duration: {Math.round(effect.duration / 60)} minutes
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-purple-300">Active</span>
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Custom Settings</Label>
                <Switch
                  checked={isCustomMode}
                  onCheckedChange={setIsCustomMode}
                />
              </div>

              {isCustomMode && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">
                      Speed: {effectSettings.speed}/10
                    </Label>
                    <Slider
                      value={[effectSettings.speed]}
                      onValueChange={(value) => setEffectSettings(prev => ({ ...prev, speed: value[0] }))}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">
                      Intensity: {effectSettings.intensity}%
                    </Label>
                    <Slider
                      value={[effectSettings.intensity]}
                      onValueChange={(value) => setEffectSettings(prev => ({ ...prev, intensity: value[0] }))}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">
                      Duration: {effectSettings.duration ?? 0} minutes
                    </Label>
                    <Slider
                      value={[effectSettings.duration ?? 0]}
                      onValueChange={(value) => setEffectSettings(prev => ({ ...prev, duration: value[0] }))}
                      max={60}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
                    <div className="flex items-center space-x-1 mb-1">
                      <Timer className="h-3 w-3" />
                      <span>Custom settings will be applied to selected effects</span>
                    </div>
                    <div>Effects will automatically stop after the duration or when manually stopped</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {activeEffect && (
          <div className="mt-4 p-3 bg-purple-600/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-purple-300">
              <Play className="h-4 w-4 animate-pulse" />
              <span className="font-medium">
                {LIGHTING_EFFECTS.find(e => e.id === activeEffect)?.name} is running
              </span>
            </div>
            <p className="text-xs text-purple-300/70 mt-1">
              This effect will override circadian mode until stopped or completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}