import fs from 'node:fs';
import path from 'node:path';
import { v3 } from 'node-hue-api';
import type {
  EffectSettings,
  GroupSummary,
  HueSceneSummary,
  LightStateSummary,
} from '@shared/types';
import { LIGHT_EFFECTS } from '@shared/constants';
import { Storage } from '../storage';

interface SavedLightState {
  on: boolean;
  bri: number;
  ct?: number;
  hue?: number;
  sat?: number;
}

type ColorState = { ct?: number; hue?: number; sat?: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveDuration(effectId: string, settings: EffectSettings): number | undefined {
  if (settings.duration && settings.duration > 0) return settings.duration;
  const def = LIGHT_EFFECTS.find((e) => e.id === effectId);
  return def?.duration;
}

export class HueBridgeService {
  private colorMap: Record<string, ColorState> | null = null;
  private previousStates: Record<string, SavedLightState> = {};
  private effectIntervals: NodeJS.Timeout[] = [];
  private effectTimeouts: NodeJS.Timeout[] = [];
  private currentEffect: string | null = null;
  private effectListener?: (effect: string | null) => void;
  private _api: any = null;

  constructor(private readonly storage: Storage) {}

  setEffectListener(listener: (effect: string | null) => void) {
    this.effectListener = listener;
  }

  private loadColorMap(): Record<string, ColorState> {
    if (!this.colorMap) {
      try {
        const file = path.resolve(process.cwd(), 'src/config/colors.json');
        const json = fs.readFileSync(file, 'utf-8');
        this.colorMap = JSON.parse(json) as Record<string, ColorState>;
      } catch (error) {
        console.warn('Failed to load color map, using defaults', error);
        this.colorMap = {
          warm: { ct: 400 },
          white: { ct: 350 },
          cool: { ct: 220 },
        };
      }
    }
    return this.colorMap;
  }

  private mapColor(name?: string): ColorState {
    if (!name) return {};
    const colors = this.loadColorMap();
    return colors[name] ?? {};
  }

  private async getApi() {
    if (this._api) return this._api;
    const bridge = this.storage.getBridge();
    if (!bridge) throw new Error('bridge_not_configured');
    this._api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
    return this._api;
  }

  async discover(): Promise<string[]> {
    const results = await v3.discovery.nupnpSearch();
    return results.map((b: any) => b.internalipaddress);
  }

  async pair(ip: string): Promise<void> {
    const unauth = await v3.api.createLocal(ip).connect();
    try {
      const user = await unauth.users.createUser('circadian-hue', 'home-server');
      this.storage.saveBridge({ ip, username: user.username });
      this._api = await v3.api.createLocal(ip).connect(user.username);
    } catch (error: any) {
      if (error.getHueErrorType && error.getHueErrorType() === 101) {
        throw new Error('link_button_not_pressed');
      }
      throw error;
    }
  }

  forgetBridge(): void {
    this.storage.clearBridge();
    this._api = null;
  }

  async listGroups(): Promise<GroupSummary[]> {
    const api = await this.getApi();
    const groups = await api.groups.getAll();
    return groups
      .filter((group: any) => ['Room', 'Zone', 'LightGroup'].includes(group.type))
      .map((group: any) => ({
        id: String(group.id),
        name: group.name,
        type: (group.type as GroupSummary['type']) ?? 'Group',
        lights: (group.lights || []).map((id: any) => String(id)),
      }));
  }

  async listScenes(): Promise<HueSceneSummary[]> {
    const api = await this.getApi();
    if (!api.scenes) return [];
    const scenes = await api.scenes.getAll();
    return scenes.map((scene: any) => ({
      id: String(scene.id),
      name: scene.name,
      groupId: scene.group ?? scene.groupid ?? scene.groupId ?? undefined,
    }));
  }

  async getRoomLightIds(roomId: string): Promise<string[]> {
    const api = await this.getApi();
    const group = await api.groups.getGroup(roomId);
    return (group?.lights || []).map((id: any) => String(id));
  }

  async applySceneToGroup(roomId: string, sceneId: string): Promise<void> {
    const api = await this.getApi();
    const state = new v3.lightStates.GroupLightState().scene(sceneId);
    await api.groups.setGroupState(roomId, state);
  }

  async applyStateToGroup(
    roomId: string,
    state: { on?: boolean; bri?: number; ct?: number; hue?: number; sat?: number },
  ): Promise<void> {
    const api = await this.getApi();
    const st = new v3.lightStates.GroupLightState();
    if (state.on !== undefined) st.on(state.on);
    if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
    if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
    if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
    if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));
    await api.groups.setGroupState(roomId, st);
  }

  async setLightState(
    id: string,
    state: { on?: boolean; bri?: number; ct?: number; hue?: number; sat?: number },
  ): Promise<void> {
    const api = await this.getApi();
    const st = new v3.lightStates.LightState();
    if (state.on !== undefined) st.on(state.on);
    if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
    if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
    if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
    if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));
    await api.lights.setLightState(id, st);
  }

  async applyStateToAllLights(state: {
    on?: boolean;
    bri?: number;
    ct?: number;
    hue?: number;
    sat?: number;
  }): Promise<void> {
    const api = await this.getApi();
    const st = new v3.lightStates.GroupLightState();
    if (state.on !== undefined) st.on(state.on);
    if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
    if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
    if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
    if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));

    try {
      await api.groups.setGroupState(0, st);
    } catch {
      const lights = await api.lights.getAll();
      await Promise.all(lights.map((l: any) => api.lights.setLightState(l.id, st)));
    }
  }

  async refreshLights(): Promise<LightStateSummary[]> {
    const api = await this.getApi();
    const lights = await api.lights.getAll();
    return lights.map((light: any) => ({
      id: String(light.id),
      name: light.name,
      isOn: Boolean(light.state.on),
      brightness: light.state.bri ?? 0,
      colorTemp: light.state.ct ?? 0,
      updatedAt: new Date().toISOString(),
    }));
  }

  private async captureCurrentStates(): Promise<void> {
    const api = await this.getApi();
    const lights = await api.lights.getAll();
    this.previousStates = {};
    lights.forEach((light: any) => {
      this.previousStates[String(light.id)] = {
        on: Boolean(light.state.on),
        bri: light.state.bri ?? 0,
        ct: light.state.ct ?? undefined,
        hue: light.state.hue ?? undefined,
        sat: light.state.sat ?? undefined,
      };
    });
  }

  private clearEffectTimers() {
    this.effectIntervals.forEach((handle) => clearInterval(handle));
    this.effectTimeouts.forEach((handle) => clearTimeout(handle));
    this.effectIntervals = [];
    this.effectTimeouts = [];
  }

  private trackInterval(handle: NodeJS.Timeout) {
    this.effectIntervals.push(handle);
  }

  private trackTimeout(handle: NodeJS.Timeout) {
    this.effectTimeouts.push(handle);
  }

  private async runBreathing(settings: EffectSettings) {
    const baseColor = this.mapColor(settings.colors?.[0] ?? 'warm');
    const speed = clamp(settings.speed ?? 3, 0.5, 10);
    const intensity = clamp(settings.intensity ?? 70, 10, 100);
    const mid = Math.round((intensity / 100) * 200);
    let level = clamp(mid, 30, 254);
    let direction = -1;
    await this.applyStateToAllLights({ on: true, bri: level, ...baseColor });
    const step = Math.max(2, Math.round(8 / speed));
    this.trackInterval(
      setInterval(() => {
        level += direction * step * 3;
        if (level <= 20) {
          level = 20;
          direction = 1;
        }
        if (level >= 240) {
          level = 240;
          direction = -1;
        }
        this.applyStateToAllLights({ on: true, bri: level, ...baseColor }).catch(() => undefined);
      }, Math.max(500, Math.round(1200 / speed))),
    );
  }

  private async runRainbow(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const speed = clamp(settings.speed ?? 5, 0.5, 10);
    let index = 0;
    await this.applyStateToAllLights({ on: true, bri: clamp((settings.intensity ?? 90) * 2.5, 60, 254), ...this.mapColor(colors[index]) });
    this.trackInterval(
      setInterval(() => {
        index = (index + 1) % colors.length;
        this.applyStateToAllLights({
          on: true,
          bri: clamp((settings.intensity ?? 90) * 2.5, 60, 254),
          ...this.mapColor(colors[index]),
        }).catch(() => undefined);
      }, Math.max(1200 / speed, 400)),
    );
  }

  private async runFireplace(settings: EffectSettings) {
    const speed = clamp(settings.speed ?? 7, 1, 10);
    const base = this.mapColor(settings.colors?.[0] ?? 'orange');
    this.trackInterval(
      setInterval(() => {
        const flicker = 40 + Math.round(Math.random() * 40 * (settings.intensity ?? 60) / 100);
        const warmth = 360 + Math.round(Math.random() * 40);
        this.applyStateToAllLights({
          on: true,
          bri: clamp(150 + flicker, 80, 254),
          ct: clamp(base.ct ?? warmth, 300, 450),
        }).catch(() => undefined);
      }, Math.max(200, Math.round(600 / speed))),
    );
  }

  private async runOcean(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['blue', 'cyan', 'teal'];
    const speed = clamp(settings.speed ?? 4, 0.5, 10);
    let index = 0;
    this.trackInterval(
      setInterval(() => {
        const wave = 120 + Math.round(Math.sin(Date.now() / 1500) * 40);
        const color = this.mapColor(colors[index]);
        index = (index + 1) % colors.length;
        this.applyStateToAllLights({
          on: true,
          bri: clamp(wave, 80, 200),
          ...color,
        }).catch(() => undefined);
      }, Math.max(1500 / speed, 600)),
    );
  }

  private async runAurora(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['green', 'purple', 'blue'];
    const speed = clamp(settings.speed ?? 2, 0.5, 6);
    this.trackInterval(
      setInterval(() => {
        const color = this.mapColor(colors[Math.floor(Math.random() * colors.length)]);
        const brightness = clamp(160 + Math.round(Math.random() * 60), 60, 254);
        this.applyStateToAllLights({ on: true, bri: brightness, ...color }).catch(() => undefined);
      }, Math.max(1800 / speed, 800)),
    );
  }

  private async runParty(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['red', 'purple', 'blue'];
    const speed = clamp(settings.speed ?? 8, 1, 12);
    let index = 0;
    this.trackInterval(
      setInterval(() => {
        const onState = index % 2 === 0;
        const color = this.mapColor(colors[index % colors.length]);
        this.applyStateToAllLights({
          on: true,
          bri: onState ? 254 : 80,
          ...color,
        }).catch(() => undefined);
        index += 1;
      }, Math.max(300, Math.round(700 / speed))),
    );
  }

  private async runMeditation(settings: EffectSettings) {
    await this.runBreathing({ ...settings, colors: settings.colors ?? ['purple'], speed: settings.speed ?? 1 });
  }

  private async runSunrise(settings: EffectSettings) {
    const palette = settings.colors?.length
      ? settings.colors
      : ['red', 'orange', 'yellow', 'warm', 'white'];
    const duration = clamp(resolveDuration('sunrise-sim', settings) ?? 1800, 300, 3600);
    const steps = palette.length * 10;
    const interval = (duration * 1000) / steps;
    let step = 0;
    this.trackInterval(
      setInterval(() => {
        step += 1;
        const progress = step / steps;
        const colorIndex = Math.min(palette.length - 1, Math.floor(progress * palette.length));
        const color = this.mapColor(palette[colorIndex]);
        const brightness = clamp(Math.round(progress * 254), 40, 254);
        this.applyStateToAllLights({ on: true, bri: brightness, ...color }).catch(() => undefined);
        if (step >= steps) {
          this.stopEffect().catch(() => undefined);
        }
      }, Math.max(interval, 1000)),
    );
  }

  private getEffectRunner(effectId: string): ((settings: EffectSettings) => Promise<void>) | undefined {
    switch (effectId) {
      case 'breathing':
        return (settings) => this.runBreathing(settings);
      case 'rainbow-cycle':
        return (settings) => this.runRainbow(settings);
      case 'fireplace':
        return (settings) => this.runFireplace(settings);
      case 'ocean-waves':
        return (settings) => this.runOcean(settings);
      case 'northern-lights':
        return (settings) => this.runAurora(settings);
      case 'party-pulse':
        return (settings) => this.runParty(settings);
      case 'meditation':
        return (settings) => this.runMeditation(settings);
      case 'sunrise-sim':
        return (settings) => this.runSunrise(settings);
      default:
        return undefined;
    }
  }

  async startEffect(effectId: string, settings: EffectSettings = {}): Promise<void> {
    const runner = this.getEffectRunner(effectId);
    if (!runner) throw new Error(`unknown_effect:${effectId}`);
    await this.stopEffect();
    await this.captureCurrentStates();
    await runner(settings);
    this.currentEffect = effectId;
    this.storage.saveActiveEffect(effectId);
    this.effectListener?.(effectId);
    const autoStop = resolveDuration(effectId, settings);
    if (autoStop) {
      this.trackTimeout(
        setTimeout(() => {
          this.stopEffect().catch(() => undefined);
        }, autoStop * 1000),
      );
    }
  }

  async stopEffect(): Promise<void> {
    this.clearEffectTimers();
    if (Object.keys(this.previousStates).length > 0) {
      try {
        const api = await this.getApi();
        await Promise.all(
          Object.entries(this.previousStates).map(([id, state]) => {
            const st = new v3.lightStates.LightState();
            if (state.on !== undefined) st.on(state.on);
            st.brightness(clamp(state.bri, 1, 254));
            if (state.ct !== undefined) st.ct(clamp(state.ct, 153, 500));
            if (state.hue !== undefined) st.hue(clamp(state.hue, 0, 65535));
            if (state.sat !== undefined) st.sat(clamp(state.sat, 0, 254));
            return api.lights.setLightState(id, st);
          }),
        );
      } catch (error) {
        console.warn('Failed to restore previous state', error);
      }
    }
    this.previousStates = {};
    if (this.currentEffect) {
      this.storage.saveActiveEffect(null);
      this.effectListener?.(null);
    }
    this.currentEffect = null;
  }

  getActiveEffect(): string | null {
    return this.currentEffect ?? this.storage.getActiveEffect()?.id ?? null;
  }
}
