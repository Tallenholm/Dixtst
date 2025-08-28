import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from 'react';
import { ScheduleEditor } from './schedule-editor';

export default function ScheduleVisualization() {
  const { data: schedule } = useQuery({
    queryKey: ['/api/schedule'],
  });

  const [editing, setEditing] = useState(false);

  const phases = [
    { name: 'Sunrise', color: 'orange-400', time: '6:30 - 8:00' },
    { name: 'Day', color: 'blue-400', time: '8:00 - 18:00' },
    { name: 'Evening', color: '[--circadian-amber]', time: '18:00 - 22:30' },
    { name: 'Night', color: 'purple-400', time: '22:30 - 6:30' }
  ];

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Daily Schedule</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300"
          onClick={() => setEditing(true)}
        >
          <Edit className="mr-2" size={16} />
          Customize
        </Button>
      </div>

      {editing && (
        <div className="mb-4">
          <ScheduleEditor
            onSave={() => setEditing(false)}
          />
        </div>
      )}
      
      {/* Schedule Graph */}
      <div className="relative h-48 bg-gray-800/50 rounded-xl p-4 mb-4">
        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[--warm-gray] px-4 pb-2">
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>12AM</span>
        </div>
        
        {/* Brightness curve visualization */}
        <div className="relative h-32 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="brightnessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: '#f59e0b', stopOpacity: 0.3}} />
                <stop offset="25%" style={{stopColor: '#3b82f6', stopOpacity: 0.3}} />
                <stop offset="75%" style={{stopColor: '#f97316', stopOpacity: 0.3}} />
                <stop offset="100%" style={{stopColor: '#1a2332', stopOpacity: 0.3}} />
              </linearGradient>
            </defs>
            <path 
              d="M 0 80 Q 100 20 200 30 Q 300 25 400 85" 
              stroke="#f59e0b" 
              strokeWidth="2" 
              fill="url(#brightnessGradient)" 
            />
            <circle cx="260" cy="45" r="4" fill="#f59e0b" className="animate-pulse" />
          </svg>
        </div>
        
        {/* Phase indicators */}
        <div className="flex justify-between text-xs">
          {phases.map((phase) => (
            <div key={phase.name} className="text-center">
              <div className={`w-3 h-3 bg-${phase.color} rounded-full mx-auto mb-1`}></div>
              <span className={`text-${phase.color}`}>{phase.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Phase details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase) => (
          <div 
            key={phase.name}
            className={`bg-${phase.color}/10 border border-${phase.color}/20 rounded-lg p-3 text-center`}
          >
            <div className={`text-${phase.color} font-medium text-sm`}>{phase.name}</div>
            <div className="text-xs text-[--warm-gray] mt-1">{phase.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
