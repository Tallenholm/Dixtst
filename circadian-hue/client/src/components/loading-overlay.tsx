import { Loader2, Sun } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = "Loading..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 text-center max-w-sm mx-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[--circadian-amber] to-orange-500 flex items-center justify-center animate-pulse">
            <Sun className="text-white animate-spin" size={24} />
          </div>
          <div className="absolute inset-0 rounded-full animate-ping bg-[--circadian-amber]/20"></div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Circadian Hue</h3>
        <p className="text-gray-300 text-sm mb-4">{message}</p>
        
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="animate-spin text-[--circadian-amber]" size={16} />
          <span className="text-xs text-gray-400">Please wait...</span>
        </div>
      </div>
    </div>
  );
}