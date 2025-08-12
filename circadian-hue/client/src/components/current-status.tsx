import { useQuery } from "@tanstack/react-query";

interface SystemStatus {
  engine: boolean;
  updates: boolean;
  schedule: boolean;
  lastUpdate: string;
  currentPhase: string;
}

interface SunTimes {
  sunrise: string;
  sunset: string;
  civilTwilightBegin?: string;
  civilTwilightEnd?: string;
}

interface CurrentPhaseData {
  phase: string;
  timestamp: string;
}

export default function CurrentStatus() {
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: sunTimes } = useQuery<SunTimes>({
    queryKey: ['/api/schedule/sun-times'],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: currentPhaseData } = useQuery<CurrentPhaseData>({
    queryKey: ['/api/schedule/current-phase'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use server-calculated phase if available, fallback to client calculation
  const currentPhase = currentPhaseData?.phase || systemStatus?.currentPhase || 'day';
  const phaseColors: Record<string, string> = {
    sunrise: 'text-orange-400',
    day: 'text-blue-400', 
    evening: 'text-[--circadian-amber]',
    night: 'text-purple-400'
  };

  const phaseDescriptions: Record<string, string> = {
    sunrise: 'Gradually brightening with cool morning light',
    day: 'Bright, energizing light for optimal productivity',
    evening: 'Gradually transitioning to warmer tones for better sleep',
    night: 'Minimal warm light to support natural sleep cycles'
  };

  const getPhaseColor = (phase: string) => phaseColors[phase] || 'text-blue-400';
  const getPhaseDescription = (phase: string) => phaseDescriptions[phase] || 'Adjusting lighting for optimal comfort';

  // Calculate progress through the day (simplified)
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + minutes / 60;
  const progress = Math.round((currentTime / 24) * 100);

  return (
    <div className="mb-8">
      <div className="glassmorphism rounded-3xl p-8 mb-6 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-[--circadian-amber] rounded-full animate-pulse-slow"></div>
            <h2 className={`text-2xl font-semibold capitalize ${getPhaseColor(currentPhase)}`}>
              {currentPhase} Phase
            </h2>
            <div className="w-3 h-3 bg-[--circadian-amber] rounded-full animate-pulse-slow"></div>
          </div>
          <p className="text-[--warm-gray] text-lg mb-6">
            {getPhaseDescription(currentPhase)}
          </p>
          
          {/* Circadian Timeline */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full gradient-circadian rounded-full transition-all duration-1000" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 text-sm text-[--warm-gray]">
              <span>{sunTimes?.sunrise || '6:30 AM'}</span>
              <span className="text-[--circadian-amber] font-medium">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>{sunTimes?.sunset || '7:45 PM'}</span>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>Sunrise</span>
              <span>Now</span>
              <span>Sunset</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
