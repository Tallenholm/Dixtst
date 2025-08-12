export function getCurrentPhase(): 'sunrise' | 'day' | 'evening' | 'night' {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + minutes / 60;

  if (currentTime >= 6.5 && currentTime < 8) return 'sunrise';
  if (currentTime >= 8 && currentTime < 18) return 'day';
  if (currentTime >= 18 && currentTime < 22.5) return 'evening';
  return 'night';
}

export function getPhaseProgress(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + minutes / 60;
  
  return Math.round((currentTime / 24) * 100);
}

export function calculateColorTemperature(phase: string, progress: number): number {
  const temperatures = {
    sunrise: { start: 2200, end: 4000 },
    day: { start: 4000, end: 6500 },
    evening: { start: 6500, end: 2700 },
    night: { start: 2700, end: 2200 }
  };

  const temp = temperatures[phase as keyof typeof temperatures] || temperatures.day;
  return Math.round(temp.start + (temp.end - temp.start) * (progress / 100));
}

export function calculateBrightness(phase: string, progress: number): number {
  const brightness = {
    sunrise: { start: 20, end: 200 },
    day: { start: 200, end: 254 },
    evening: { start: 254, end: 100 },
    night: { start: 100, end: 20 }
  };

  const bright = brightness[phase as keyof typeof brightness] || brightness.day;
  return Math.round(bright.start + (bright.end - bright.start) * (progress / 100));
}
