import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, Lightbulb, Palette, Save } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface Schedule {
  id: string;
  name: string;
  isActive: boolean;
  sunriseOffset: number;
  sunsetOffset: number;
  phases: {
    sunrise: { brightness: number; colorTemp: number };
    day: { brightness: number; colorTemp: number };
    evening: { brightness: number; colorTemp: number };
    night: { brightness: number; colorTemp: number };
  };
}

interface Location {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isActive: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("schedule");

  const { data: schedule } = useQuery<Schedule>({
    queryKey: ['/api/schedule'],
  });

  const { data: location } = useQuery<Location>({
    queryKey: ['/api/location'],
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (updates: Partial<Schedule>) => {
      const response = await fetch(`/api/schedule/${schedule?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "Settings Updated",
        description: "Your schedule settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule settings.",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { city: string; country: string }) => {
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location'] });
      toast({
        title: "Location Updated",
        description: "Your location has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location.",
        variant: "destructive",
      });
    },
  });

  const detectLocationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/location/detect', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to detect location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location'] });
      toast({
        title: "Location Detected",
        description: "Your location has been automatically detected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to detect location automatically.",
        variant: "destructive",
      });
    },
  });

  if (!schedule || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[--deep-navy] via-[--midnight-blue] to-black flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--deep-navy] via-[--midnight-blue] to-black text-white">
      <header className="border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-[--circadian-amber]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[--circadian-amber] to-orange-400 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
            </TabsTrigger>
            <TabsTrigger value="lighting" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Lighting</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Schedule Settings */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Circadian Schedule</CardTitle>
                <CardDescription>
                  Configure your daily lighting schedule and phase transitions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sunriseOffset">Sunrise Offset (minutes)</Label>
                    <div className="space-y-2">
                      <Slider
                        id="sunriseOffset"
                        min={-60}
                        max={60}
                        step={5}
                        value={[schedule.sunriseOffset || 0]}
                        onValueChange={(value) => {
                          updateScheduleMutation.mutate({ sunriseOffset: value[0] });
                        }}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400 text-center">
                        {schedule.sunriseOffset || 0} minutes
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sunsetOffset">Sunset Offset (minutes)</Label>
                    <div className="space-y-2">
                      <Slider
                        id="sunsetOffset"
                        min={-60}
                        max={60}
                        step={5}
                        value={[schedule.sunsetOffset || 0]}
                        onValueChange={(value) => {
                          updateScheduleMutation.mutate({ sunsetOffset: value[0] });
                        }}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400 text-center">
                        {schedule.sunsetOffset || 0} minutes
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Phase Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(schedule.phases || {}).map(([phase, settings]) => (
                      <Card key={phase} className="bg-gray-800/50 border-gray-600">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm capitalize text-white">{phase}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Brightness</Label>
                            <Slider
                              min={1}
                              max={254}
                              step={1}
                              value={[settings.brightness]}
                              onValueChange={(value) => {
                                updateScheduleMutation.mutate({
                                  phases: {
                                    ...schedule.phases,
                                    [phase]: { ...settings, brightness: value[0] }
                                  }
                                });
                              }}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                              {settings.brightness}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Color Temperature</Label>
                            <Slider
                              min={2000}
                              max={6500}
                              step={100}
                              value={[settings.colorTemp]}
                              onValueChange={(value) => {
                                updateScheduleMutation.mutate({
                                  phases: {
                                    ...schedule.phases,
                                    [phase]: { ...settings, colorTemp: value[0] }
                                  }
                                });
                              }}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                              {settings.colorTemp}K
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Settings */}
          <TabsContent value="location" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Location Settings</CardTitle>
                <CardDescription>
                  Set your location for accurate sunrise and sunset calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={location.city}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={location.country}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={location.latitude.toFixed(4)}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={location.longitude.toFixed(4)}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => detectLocationMutation.mutate()}
                    disabled={detectLocationMutation.isPending}
                    className="bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {detectLocationMutation.isPending ? 'Detecting...' : 'Auto-Detect Location'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lighting Settings */}
          <TabsContent value="lighting" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Lighting Preferences</CardTitle>
                <CardDescription>
                  Customize your lighting behavior and transitions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Gradual Transitions</Label>
                      <div className="text-sm text-gray-400">
                        Smooth transitions between lighting phases
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Weekend Schedule</Label>
                      <div className="text-sm text-gray-400">
                        Use different timing on weekends
                      </div>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Motion Override</Label>
                      <div className="text-sm text-gray-400">
                        Temporarily brighten lights when motion is detected
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advanced Settings</CardTitle>
                <CardDescription>
                  Fine-tune system behavior and experimental features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="updateInterval">Update Interval (minutes)</Label>
                    <Select defaultValue="2">
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="2">2 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transitionDuration">Transition Duration (seconds)</Label>
                    <Slider
                      id="transitionDuration"
                      min={5}
                      max={60}
                      step={5}
                      defaultValue={[10]}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Debug Mode</Label>
                      <div className="text-sm text-gray-400">
                        Enable detailed logging for troubleshooting
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}