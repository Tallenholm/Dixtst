import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sunrise, Moon, Clock, Zap } from "lucide-react";

export default function SleepWakeControls() {
  const { toast } = useToast();
  const [wakeUpDuration, setWakeUpDuration] = useState([30]);
  const [sleepDuration, setSleepDuration] = useState([20]);
  const [wakeUpEnabled, setWakeUpEnabled] = useState(false);
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:00");

  const sleepMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/lights/sleep-mode', {
        method: 'POST',
        body: { duration: sleepDuration[0] },
      });
    },
    onSuccess: () => {
      toast({
        title: "Sleep Mode Activated",
        description: `Lights will gradually dim to warm tones over ${sleepDuration[0]} minutes.`,
      });
    },
  });

  const wakeUpMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/lights/wake-up', {
        method: 'POST',
        body: { duration: wakeUpDuration[0] },
      });
    },
    onSuccess: () => {
      toast({
        title: "Wake-Up Sequence Started",
        description: `Sunrise simulation will run for ${wakeUpDuration[0]} minutes.`,
      });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/sleep-wake-schedule', {
        method: 'POST',
        body: {
          wakeUp: {
            enabled: wakeUpEnabled,
            time: wakeUpTime,
            duration: wakeUpDuration[0],
          },
          sleep: {
            enabled: sleepEnabled,
            time: sleepTime,
            duration: sleepDuration[0],
          },
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Sleep/Wake Schedule Saved",
        description: "Your automated sleep and wake-up routines are now active.",
      });
    },
  });

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Moon className="h-5 w-5 text-purple-400" />
          <span>Sleep & Wake Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => sleepMutation.mutate()}
            disabled={sleepMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Moon className="h-4 w-4 mr-2" />
            Sleep Now
          </Button>
          <Button
            onClick={() => wakeUpMutation.mutate()}
            disabled={wakeUpMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Sunrise className="h-4 w-4 mr-2" />
            Wake Up
          </Button>
        </div>

        {/* Wake-Up Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white font-medium">Automatic Wake-Up</Label>
            <Switch
              checked={wakeUpEnabled}
              onCheckedChange={setWakeUpEnabled}
            />
          </div>
          
          {wakeUpEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-orange-500/30">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Wake-Up Time</Label>
                <Select value={wakeUpTime} onValueChange={setWakeUpTime}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">
                  Sunrise Duration: {wakeUpDuration[0]} minutes
                </Label>
                <Slider
                  value={wakeUpDuration}
                  onValueChange={setWakeUpDuration}
                  max={60}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sleep Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white font-medium">Automatic Sleep Mode</Label>
            <Switch
              checked={sleepEnabled}
              onCheckedChange={setSleepEnabled}
            />
          </div>
          
          {sleepEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Sleep Time</Label>
                <Select value={sleepTime} onValueChange={setSleepTime}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">
                  Sleep Transition: {sleepDuration[0]} minutes
                </Label>
                <Slider
                  value={sleepDuration}
                  onValueChange={setSleepDuration}
                  max={60}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Schedule */}
        {(wakeUpEnabled || sleepEnabled) && (
          <Button
            onClick={() => saveScheduleMutation.mutate()}
            disabled={saveScheduleMutation.isPending}
            className="w-full bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black"
          >
            <Clock className="h-4 w-4 mr-2" />
            Save Sleep/Wake Schedule
          </Button>
        )}
      </CardContent>
    </Card>
  );
}