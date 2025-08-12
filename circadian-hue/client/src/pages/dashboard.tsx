import { useWebSocket } from "@/hooks/use-websocket";
import CurrentStatus from "@/components/current-status";
import ConnectedLights from "@/components/connected-lights";
import ScheduleVisualization from "@/components/schedule-visualization";
import QuickControls from "@/components/quick-controls";
import LocationSettings from "@/components/location-settings";
import BridgeConnection from "@/components/bridge-connection";
import SystemStatus from "@/components/system-status";
import SleepWakeControls from "@/components/sleep-wake-controls";
import PresetScenes from "@/components/preset-scenes";
import RoomGroups from "@/components/room-groups";
import AnalyticsInsights from "@/components/analytics-insights";
import EnhancedStatusBar from "@/components/enhanced-status-bar";
import NotificationCenter from "@/components/notification-center";
import AdvancedLightingEffects from "@/components/advanced-lighting-effects";
import { Button } from "@/components/ui/button";
import { Settings, Sun, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { connectionStatus } = useWebSocket();

  return (
    <div className="min-h-screen">
      {/* Enhanced Status Overlays */}
      <EnhancedStatusBar />
      <NotificationCenter />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[--circadian-amber] to-orange-500 flex items-center justify-center">
                <Sun className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold">Circadian Hue</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className={
                  connectionStatus === 'connected' ? 'text-green-400' : 
                  connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                }>
                  {connectionStatus === 'connected' ? 'Bridge Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Settings className="text-[--warm-gray]" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        <CurrentStatus />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Light Controls */}
          <div className="lg:col-span-2 space-y-6">
            <ConnectedLights />
            <ScheduleVisualization />
            <AnalyticsInsights />
          </div>
          
          {/* Right Column: Controls & Settings */}
          <div className="space-y-6">
            <QuickControls />
            <PresetScenes />
            <AdvancedLightingEffects />
            <SleepWakeControls />
            <RoomGroups />
            <LocationSettings />
            <BridgeConnection />
            <SystemStatus />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-[--circadian-amber] to-orange-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110">
          <Zap className="text-white group-hover:rotate-12 transition-transform" size={20} />
        </button>
      </div>
    </div>
  );
}
