import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Monitor, 
  Coffee, 
  BookOpen, 
  Moon, 
  Sunset, 
  Sun, 
  Lightbulb,
  Heart,
  Zap,
  Focus,
  Home
} from "lucide-react";

interface PresetScene {
  id: string;
  name: string;
  description: string;
  icon: string;
  brightness: number;
  colorTemp: number;
  color?: { r: number; g: number; b: number };
  category: 'work' | 'relax' | 'health' | 'entertainment';
}

const PRESET_SCENES: PresetScene[] = [
  // Work & Focus
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Bright, cool light to enhance concentration',
    icon: 'Monitor',
    brightness: 254,
    colorTemp: 5500,
    category: 'work'
  },
  {
    id: 'meeting',
    name: 'Video Call',
    description: 'Professional lighting for video conferences',
    icon: 'Monitor',
    brightness: 200,
    colorTemp: 4500,
    category: 'work'
  },
  
  // Relaxation
  {
    id: 'cozy',
    name: 'Cozy Evening',
    description: 'Warm, dimmed lights for relaxation',
    icon: 'Coffee',
    brightness: 80,
    colorTemp: 2200,
    category: 'relax'
  },
  {
    id: 'reading',
    name: 'Reading Light',
    description: 'Comfortable lighting for extended reading',
    icon: 'BookOpen',
    brightness: 180,
    colorTemp: 3500,
    category: 'relax'
  },
  
  // Health & Sleep
  {
    id: 'bedtime',
    name: 'Bedtime',
    description: 'Red-tinted light to preserve melatonin',
    icon: 'Moon',
    brightness: 30,
    colorTemp: 2000,
    color: { r: 255, g: 100, b: 50 },
    category: 'health'
  },
  {
    id: 'energize',
    name: 'Energize',
    description: 'Bright daylight to boost alertness',
    icon: 'Zap',
    brightness: 254,
    colorTemp: 6500,
    category: 'health'
  },
  
  // Entertainment
  {
    id: 'movie',
    name: 'Movie Night',
    description: 'Dimmed ambient lighting for viewing',
    icon: 'Monitor',
    brightness: 50,
    colorTemp: 2700,
    category: 'entertainment'
  },
  {
    id: 'party',
    name: 'Party Mode',
    description: 'Dynamic colorful lighting',
    icon: 'Heart',
    brightness: 200,
    colorTemp: 4000,
    color: { r: 255, g: 100, b: 200 },
    category: 'entertainment'
  }
];

const getIcon = (iconName: string) => {
  const icons = {
    Monitor, Coffee, BookOpen, Moon, Sunset, Sun, Lightbulb, Heart, Zap, Focus, Home
  };
  const IconComponent = icons[iconName as keyof typeof icons] || Lightbulb;
  return IconComponent;
};

const getCategoryColor = (category: string) => {
  const colors = {
    work: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    relax: 'bg-green-500/20 text-green-400 border-green-500/50',
    health: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    entertainment: 'bg-pink-500/20 text-pink-400 border-pink-500/50'
  };
  return colors[category as keyof typeof colors] || colors.work;
};

export default function PresetScenes() {
  const { toast } = useToast();

  const { data: currentScene } = useQuery<string>({
    queryKey: ['/api/scenes/current'],
  });

  const applySceneMutation = useMutation({
    mutationFn: async (scene: PresetScene) => {
      return apiRequest('/api/scenes/apply', 'POST', {
        sceneId: scene.id,
        brightness: scene.brightness,
        colorTemp: scene.colorTemp,
        color: scene.color
      });
    },
    onSuccess: (_, scene) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scenes/current'] });
      toast({
        title: `${scene.name} Applied`,
        description: scene.description,
      });
    },
    onError: () => {
      toast({
        title: "Scene Failed",
        description: "Could not apply the selected scene. Check your bridge connection.",
        variant: "destructive",
      });
    },
  });

  const groupedScenes = PRESET_SCENES.reduce((acc, scene) => {
    if (!acc[scene.category]) {
      acc[scene.category] = [];
    }
    acc[scene.category].push(scene);
    return acc;
  }, {} as Record<string, PresetScene[]>);

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <span>Preset Scenes</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedScenes).map(([category, scenes]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge className={getCategoryColor(category)}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {scenes.map((scene) => {
                const IconComponent = getIcon(scene.icon);
                const isActive = currentScene === scene.id;
                
                return (
                  <Button
                    key={scene.id}
                    onClick={() => applySceneMutation.mutate(scene)}
                    disabled={applySceneMutation.isPending}
                    variant="outline"
                    className={`
                      h-auto p-3 justify-start text-left
                      ${isActive 
                        ? 'bg-[--circadian-amber]/20 border-[--circadian-amber] text-[--circadian-amber]' 
                        : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${isActive ? 'bg-[--circadian-amber]/30' : 'bg-gray-700'}
                      `}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{scene.name}</div>
                        <div className={`text-xs ${isActive ? 'text-[--circadian-amber]/70' : 'text-gray-400'}`}>
                          {scene.description}
                        </div>
                        <div className={`text-xs flex items-center space-x-2 mt-1 ${isActive ? 'text-[--circadian-amber]/70' : 'text-gray-500'}`}>
                          <span>{Math.round((scene.brightness / 254) * 100)}% brightness</span>
                          <span>•</span>
                          <span>{scene.colorTemp}K</span>
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-[--circadian-amber] rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Scenes override circadian mode temporarily. Normal schedule resumes at next phase.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}