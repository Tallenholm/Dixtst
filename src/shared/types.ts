export type CircadianPhase = 'night' | 'dawn' | 'day' | 'dusk';

export interface LightStateSummary {
  id: string;
  name: string;
  isOn: boolean;
  brightness: number;
  colorTemp: number;
  updatedAt: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  type: 'Room' | 'Zone' | 'Group';
  lights: string[];
}

export interface PresetScene {
  id: string;
  name: string;
  description: string;
  brightness: number;
  colorTemp: number;
}

export interface HueSceneSummary {
  id: string;
  name: string;
  groupId?: string;
}

export interface EffectSettings {
  speed?: number;
  intensity?: number;
  duration?: number;
  colors?: string[];
}

export interface LightEffectDefinition {
  id: string;
  name: string;
  description: string;
  category: 'ambient' | 'dynamic' | 'therapeutic' | 'entertainment';
  duration?: number;
  defaultSettings: Required<Pick<EffectSettings, 'speed' | 'intensity' | 'colors'>> & {
    duration?: number;
  };
}

export interface ScheduleEntry {
  id: string;
  name: string;
  wakeTime: string;
  sleepTime: string;
  enabled: boolean;
  days?: number[];
  wakeBrightness?: number;
  wakeColorTemp?: number;
  sleepBrightness?: number;
  sleepColorTemp?: number;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface BridgeCredentials {
  ip: string;
  username: string;
}

export interface BridgeState {
  configured: boolean;
  ip?: string;
}

export interface StatusPayload {
  phase: CircadianPhase;
  nextPhaseAt?: string;
  lights: LightStateSummary[];
  groups: GroupSummary[];
  schedules: ScheduleEntry[];
  location?: LocationInfo;
  bridge: BridgeState;
  activeEffect: string | null;
  effects: LightEffectDefinition[];
  presetScenes: PresetScene[];
  hueScenes: HueSceneSummary[];
  updatedAt: string;
}
