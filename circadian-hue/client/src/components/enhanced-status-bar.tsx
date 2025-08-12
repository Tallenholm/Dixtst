import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Battery, 
  Activity,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface SystemStatus {
  engine: boolean;
  updates: boolean;
  schedule: boolean;
  lastUpdate: string;
  currentPhase: string;
}

interface CurrentPhase {
  phase: string;
  timestamp: string;
}

const getPhaseIcon = (phase: string) => {
  switch (phase) {
    case 'sunrise': return Sunrise;
    case 'day': return Sun;
    case 'evening': return Sunset;
    case 'night': return Moon;
    default: return Clock;
  }
};

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'sunrise': return 'text-orange-400';
    case 'day': return 'text-yellow-400';
    case 'evening': return 'text-red-400';
    case 'night': return 'text-purple-400';
    default: return 'text-gray-400';
  }
};

export default function EnhancedStatusBar() {
  const { connectionStatus } = useWebSocket();
  
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: currentPhase } = useQuery<CurrentPhase>({
    queryKey: ['/api/schedule/current-phase'],
    refetchInterval: 60000, // Update every minute
  });

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return CheckCircle;
      case 'connecting': return Activity;
      default: return AlertTriangle;
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400 border-green-400/50';
      case 'connecting': return 'text-yellow-400 border-yellow-400/50';
      default: return 'text-red-400 border-red-400/50';
    }
  };

  const PhaseIcon = currentPhase ? getPhaseIcon(currentPhase.phase) : Clock;
  const ConnectionIcon = getConnectionIcon();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
      {/* Current Phase Indicator */}
      {currentPhase && (
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`${getPhaseColor(currentPhase.phase)} border-current/50 bg-black/60 backdrop-blur-sm`}
            >
              <PhaseIcon className="h-3 w-3 mr-1" />
              {currentPhase.phase.charAt(0).toUpperCase() + currentPhase.phase.slice(1)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Current circadian phase</p>
            <p className="text-xs text-gray-400">
              Updated: {new Date(currentPhase.timestamp).toLocaleTimeString()}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* System Status */}
      {systemStatus && (
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`${systemStatus.engine ? 'text-green-400 border-green-400/50' : 'text-red-400 border-red-400/50'} bg-black/60 backdrop-blur-sm`}
            >
              <Battery className="h-3 w-3 mr-1" />
              Engine {systemStatus.engine ? 'Active' : 'Inactive'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Circadian Engine Status</p>
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Updates:</span>
                  <span className={systemStatus.updates ? 'text-green-400' : 'text-red-400'}>
                    {systemStatus.updates ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Schedule:</span>
                  <span className={systemStatus.schedule ? 'text-green-400' : 'text-red-400'}>
                    {systemStatus.schedule ? 'Active' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span>{new Date(systemStatus.lastUpdate).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Connection Status */}
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="outline" 
            className={`${getConnectionColor()} bg-black/60 backdrop-blur-sm animate-pulse`}
          >
            <ConnectionIcon className="h-3 w-3 mr-1" />
            {connectionStatus === 'connected' ? 'Bridge' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Hue Bridge Connection</p>
            <p className="text-xs text-gray-400">
              Status: {connectionStatus}
            </p>
            {connectionStatus === 'disconnected' && (
              <p className="text-xs text-red-300">
                Check bridge connection and network
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}