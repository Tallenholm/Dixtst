import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { fetchJson, getAuthContext } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Home, Plus, Edit3, Lightbulb, Users, MoreVertical } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setRooms } from "@/state/roomsSlice";

interface Light {
  id: string;
  name: string;
  isOn: boolean;
  brightness: number;
  colorTemp: number;
  room?: string;
}

interface Room {
  id: string;
  name: string;
  lights: string[];
  isOn: boolean;
  icon: string;
}

export default function RoomGroups() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const rooms = useAppSelector((state) => state.rooms.list);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const { data: lights } = useQuery<Light[]>({
    queryKey: ['/api/lights'],
  });

  const { data: roomsData } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  useEffect(() => {
    if (roomsData) {
      dispatch(setRooms(roomsData));
    }
  }, [roomsData, dispatch]);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      return fetchJson('/api/rooms', {
        method: 'POST',
        body: {
          name: newRoomName,
          lights: selectedLights,
          icon: 'Home',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setNewRoomName("");
      setSelectedLights([]);
      setIsCreatingRoom(false);
      toast({
        title: "Room Created",
        description: `${newRoomName} has been created with ${selectedLights.length} lights.`,
      });
    },
  });

  const toggleRoomMutation = useMutation({
    mutationFn: async ({ roomId, isOn }: { roomId: string; isOn: boolean }) => {
      return fetchJson(`/api/rooms/${roomId}/toggle`, {
        method: 'POST',
        body: { isOn, userId: getAuthContext()?.userId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lights'] });
    },
  });

  const handleLightToggle = (lightId: string) => {
    setSelectedLights(prev => 
      prev.includes(lightId) 
        ? prev.filter(id => id !== lightId)
        : [...prev, lightId]
    );
  };

  const getRoomLights = (room: Room) => {
    return lights?.filter(light => room.lights.includes(light.id)) || [];
  };

  const getUngroupedLights = () => {
    const groupedLightIds = rooms?.flatMap(room => room.lights) || [];
    return lights?.filter(light => !groupedLightIds.includes(light.id)) || [];
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-blue-400" />
            <span>Room Groups</span>
          </div>
          <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black">
                <Plus className="h-4 w-4 mr-1" />
                New Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Room Name</Label>
                  <Input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Living Room, Bedroom, Office"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Select Lights</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {lights?.map((light) => (
                      <div key={light.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={light.id}
                          checked={selectedLights.includes(light.id)}
                          onCheckedChange={() => handleLightToggle(light.id)}
                        />
                        <Label htmlFor={light.id} className="text-gray-300 flex-1">
                          {light.name}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {light.isOn ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={() => createRoomMutation.mutate()}
                  disabled={!newRoomName || selectedLights.length === 0 || createRoomMutation.isPending}
                  className="w-full bg-[--circadian-amber] hover:bg-[--circadian-amber]/80 text-black"
                >
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Rooms */}
        {rooms && rooms.length > 0 && (
          <div className="space-y-3">
            {rooms.map((room) => {
              const roomLights = getRoomLights(room);
              const onLights = roomLights.filter(light => light.isOn).length;
              
              return (
                <div key={room.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-white">{room.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {onLights}/{roomLights.length} on
                      </Badge>
                    </div>
                    <Switch
                      checked={room.isOn}
                      onCheckedChange={(isOn) => toggleRoomMutation.mutate({ roomId: room.id, isOn })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {roomLights.map((light) => (
                      <div key={light.id} className="flex items-center space-x-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${light.isOn ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={light.isOn ? 'text-gray-300' : 'text-gray-500'}>
                          {light.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ungrouped Lights */}
        {getUngroupedLights().length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Ungrouped Lights</Label>
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {getUngroupedLights().map((light) => (
                  <div key={light.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${light.isOn ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span className={light.isOn ? 'text-gray-300' : 'text-gray-500'}>
                      {light.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!rooms || rooms.length === 0) && (!lights || lights.length === 0) && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No rooms created yet</p>
            <p className="text-sm text-gray-500">Connect some lights first, then create rooms to group them</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}