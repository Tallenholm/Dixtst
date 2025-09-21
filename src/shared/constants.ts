import { LightEffectDefinition, PresetScene } from './types';

export const PRESET_SCENES: PresetScene[] = [
  {
    id: 'focus',
    name: 'Focus',
    description: 'Bright neutral white for productivity',
    brightness: 220,
    colorTemp: 250,
  },
  {
    id: 'relax',
    name: 'Relax',
    description: 'Warm amber evening lighting',
    brightness: 140,
    colorTemp: 370,
  },
  {
    id: 'cozy',
    name: 'Cozy',
    description: 'Soft warm glow for winding down',
    brightness: 100,
    colorTemp: 400,
  },
  {
    id: 'bright',
    name: 'Bright',
    description: 'Full brightness cool daylight',
    brightness: 254,
    colorTemp: 220,
  },
];

export const LIGHT_EFFECTS: LightEffectDefinition[] = [
  {
    id: 'breathing',
    name: 'Breathing',
    description: 'Gentle fade in/out for relaxation',
    category: 'therapeutic',
    duration: 300,
    defaultSettings: { speed: 3, intensity: 70, colors: ['warm'], duration: 300 },
  },
  {
    id: 'rainbow-cycle',
    name: 'Rainbow Cycle',
    description: 'Smooth transitions across the color spectrum',
    category: 'entertainment',
    defaultSettings: {
      speed: 5,
      intensity: 90,
      colors: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
    },
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Warm flickering like a cozy fire',
    category: 'ambient',
    defaultSettings: { speed: 7, intensity: 60, colors: ['orange', 'red', 'yellow'] },
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Rolling cool blue waves for calm evenings',
    category: 'therapeutic',
    defaultSettings: { speed: 4, intensity: 55, colors: ['blue', 'cyan', 'teal'] },
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    description: 'Aurora-inspired greens and purples',
    category: 'ambient',
    defaultSettings: { speed: 2, intensity: 80, colors: ['green', 'purple', 'blue'] },
  },
  {
    id: 'party-pulse',
    name: 'Party Pulse',
    description: 'High-energy synchronized flashing',
    category: 'dynamic',
    defaultSettings: { speed: 9, intensity: 100, colors: ['red', 'purple', 'blue'] },
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: 'Ultra-slow breathing for deep focus',
    category: 'therapeutic',
    duration: 600,
    defaultSettings: { speed: 1, intensity: 35, colors: ['purple'] },
  },
  {
    id: 'sunrise-sim',
    name: 'Sunrise Simulation',
    description: 'Natural awakening light progression',
    category: 'therapeutic',
    duration: 1800,
    defaultSettings: {
      speed: 1,
      intensity: 100,
      colors: ['red', 'orange', 'yellow', 'warm', 'white'],
    },
  },
];

export const CIRCADIAN_PHASE_SETTINGS: Record<string, { brightness: number; colorTemp: number }> = {
  night: { brightness: 50, colorTemp: 430 },
  dawn: { brightness: 120, colorTemp: 360 },
  day: { brightness: 210, colorTemp: 250 },
  dusk: { brightness: 140, colorTemp: 380 },
};

export const DEFAULT_LOCATION_DETECT_URL = 'https://ipapi.co/json/';
