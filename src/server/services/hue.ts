import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v3 } from 'node-hue-api';
import type {
  EffectSettings,
  GroupSummary,
  HueSceneSummary,
  LightStateSummary,
} from '@shared/types';
import { LIGHT_EFFECTS } from '@shared/constants';
import { Storage } from '../storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * A simple sequential promise queue to prevent bridge overload.
 */
class PromiseQueue {
  private queue: Promise<any> = Promise.resolve();

  add<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn).catch((e) => {
      // Re-throw so the caller sees the error
      throw e;
    });
    // Append to queue, catching error to keep chain alive
    this.queue = next.catch(() => {});
    return next;
  }
}

export class HueBridgeService {
  private colorMap: Record<string, ColorState> | null = null;
  private previousStates: Record<string, SavedLightState> = {};
  private effectIntervals: NodeJS.Timeout[] = [];
  private effectTimeouts: NodeJS.Timeout[] = [];
  private currentEffect: string | null = null;
  private effectListener?: (effect: string | null) => void;
  private _api: any = null;
  private readonly queue = new PromiseQueue();

  constructor(private readonly storage: Storage) {}

  setEffectListener(listener: (effect: string | null) => void) {
    this.effectListener = listener;
  }

  private loadColorMap(): Record<string, ColorState> {
    if (!this.colorMap) {
      try {
        // Resolve path relative to this file, then navigate to config/colors.json
        // In dev: src/server/services/hue.ts -> ../../config/colors.json
        // In prod: dist/server/services/hue.js -> ../../config/colors.json (needs to be copied)
        // If not found, try process.cwd() fallback
        let file = path.resolve(__dirname, '../../config/colors.json');
        if (!fs.existsSync(file)) {
             file = path.resolve(process.cwd(), 'src/config/colors.json');
        }

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

    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        this._api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
        return this._api;
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Enqueues an API operation to ensure sequential execution.
   */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.add(fn);
  }

  async discover(): Promise<string[]> {
    // Discovery doesn't need queueing, it's independent
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
    return this.enqueue(async () => {
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
    });
  }

  async listScenes(): Promise<HueSceneSummary[]> {
    return this.enqueue(async () => {
        const api = await this.getApi();
        if (!api.scenes) return [];
        const scenes = await api.scenes.getAll();
        return scenes.map((scene: any) => ({
        id: String(scene.id),
        name: scene.name,
        groupId: scene.group ?? scene.groupid ?? scene.groupId ?? undefined,
        }));
    });
  }

  async getRoomLightIds(roomId: string): Promise<string[]> {
    return this.enqueue(async () => {
        const api = await this.getApi();
        const group = await api.groups.getGroup(roomId);
        return (group?.lights || []).map((id: any) => String(id));
    });
  }

  async applySceneToGroup(roomId: string, sceneId: string): Promise<void> {
    await this.enqueue(async () => {
        const api = await this.getApi();
        const state = new v3.lightStates.GroupLightState().scene(sceneId);
        await api.groups.setGroupState(roomId, state);
    });
  }

  async applyStateToGroup(
    roomId: string,
    state: { on?: boolean; bri?: number; ct?: number; hue?: number; sat?: number; transitionTime?: number },
  ): Promise<void> {
    await this.enqueue(async () => {
        const api = await this.getApi();
        const st = new v3.lightStates.GroupLightState();
        if (state.on !== undefined) st.on(state.on);
        if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
        if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
        if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
        if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));
        if (typeof state.transitionTime === 'number') st.transitiontime(state.transitionTime);
        await api.groups.setGroupState(roomId, st);
    });
  }

  async setLightState(
    id: string,
    state: { on?: boolean; bri?: number; ct?: number; hue?: number; sat?: number; transitionTime?: number },
  ): Promise<void> {
    await this.enqueue(async () => {
        const api = await this.getApi();
        const st = new v3.lightStates.LightState();
        if (state.on !== undefined) st.on(state.on);
        if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
        if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
        if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
        if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));
        if (typeof state.transitionTime === 'number') st.transitiontime(state.transitionTime);
        await api.lights.setLightState(id, st);
    });
  }

  async applyStateToAllLights(state: {
    on?: boolean;
    bri?: number;
    ct?: number;
    hue?: number;
    sat?: number;
    transitionTime?: number;
  }): Promise<void> {
    await this.enqueue(async () => {
        const api = await this.getApi();
        const st = new v3.lightStates.GroupLightState();
        if (state.on !== undefined) st.on(state.on);
        if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
        if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
        if (typeof state.hue === 'number') st.hue(clamp(state.hue, 0, 65535));
        if (typeof state.sat === 'number') st.sat(clamp(state.sat, 0, 254));
        if (typeof state.transitionTime === 'number') st.transitiontime(state.transitionTime);

        try {
            // Try group 0 (all lights)
            await api.groups.setGroupState(0, st);
        } catch {
            // Fallback to individual lights
            const lights = await api.lights.getAll();
            // Sequential execution for reliability
            for (const l of lights) {
                 await api.lights.setLightState(l.id, st);
            }
        }
    });
  }

  /**
   * Applies state only to lights that are currently ON.
   * Useful for circadian rhythm updates that shouldn't turn on lights that were manually turned off.
   */
  async applyCircadianLightState(state: {
    bri?: number;
    ct?: number;
    transitionTime?: number;
  }): Promise<void> {
    await this.enqueue(async () => {
      const api = await this.getApi();
      const lights = await api.lights.getAll();

      // Filter for lights that are currently ON
      // Note: 'on' property in node-hue-api light object can be nested or direct depending on version/mock
      // based on existing code: `isOn: Boolean(light.state.on)`
      const activeLights = lights.filter((l: any) => l.state && l.state.on);

      if (activeLights.length === 0) return;

      const st = new v3.lightStates.LightState();
      if (typeof state.bri === 'number') st.brightness(clamp(state.bri, 1, 254));
      if (typeof state.ct === 'number') st.ct(clamp(state.ct, 153, 500));
      if (typeof state.transitionTime === 'number') st.transitiontime(state.transitionTime);

      // Apply to each active light
      for (const l of activeLights) {
        // We do not set 'on: true', so if it somehow turned off in between, it stays off (or errors safely)
        await api.lights.setLightState(l.id, st).catch(() => {});
      }
    });
  }

  async refreshLights(): Promise<LightStateSummary[]> {
    return this.enqueue(async () => {
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
    });
  }

  private async captureCurrentStates(): Promise<void> {
    // This runs before starting an effect, so it should be queued
    await this.enqueue(async () => {
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

  private async runEffectLoop(
      _settings: EffectSettings,
      interval: number,
      updateFn: () => Promise<void>
  ) {
      let running = false;
      this.trackInterval(
          setInterval(async () => {
              if (running) return;
              running = true;
              try {
                  await updateFn();
              } catch {
                  // ignore
              } finally {
                  running = false;
              }
          }, interval)
      );
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

    await this.runEffectLoop(settings, Math.max(500, Math.round(1200 / speed)), async () => {
        level += direction * step * 3;
        if (level <= 20) {
            level = 20;
            direction = 1;
        }
        if (level >= 240) {
            level = 240;
            direction = -1;
        }
        await this.applyStateToAllLights({ on: true, bri: level, ...baseColor });
    });
  }

  private async runRainbow(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const speed = clamp(settings.speed ?? 5, 0.5, 10);
    let index = 0;
    const initialColor = this.mapColor(colors[index]);
    await this.applyStateToAllLights({ on: true, bri: clamp((settings.intensity ?? 90) * 2.5, 60, 254), ...initialColor });

    await this.runEffectLoop(settings, Math.max(1200 / speed, 400), async () => {
        index = (index + 1) % colors.length;
        await this.applyStateToAllLights({
          on: true,
          bri: clamp((settings.intensity ?? 90) * 2.5, 60, 254),
          ...this.mapColor(colors[index]),
        });
    });
  }

  private async runFireplace(settings: EffectSettings) {
    const speed = clamp(settings.speed ?? 7, 1, 10);
    const base = this.mapColor(settings.colors?.[0] ?? 'orange');

    await this.runEffectLoop(settings, Math.max(200, Math.round(600 / speed)), async () => {
        const flicker = 40 + Math.round(Math.random() * 40 * (settings.intensity ?? 60) / 100);
        const warmth = 360 + Math.round(Math.random() * 40);
        await this.applyStateToAllLights({
          on: true,
          bri: clamp(150 + flicker, 80, 254),
          ct: clamp(base.ct ?? warmth, 300, 450),
        });
    });
  }

  private async runOcean(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['blue', 'cyan', 'teal'];
    const speed = clamp(settings.speed ?? 4, 0.5, 10);
    let index = 0;

    await this.runEffectLoop(settings, Math.max(1500 / speed, 600), async () => {
        const wave = 120 + Math.round(Math.sin(Date.now() / 1500) * 40);
        const color = this.mapColor(colors[index]);
        index = (index + 1) % colors.length;
        await this.applyStateToAllLights({
          on: true,
          bri: clamp(wave, 80, 200),
          ...color,
        });
    });
  }

  private async runAurora(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['green', 'purple', 'blue'];
    const speed = clamp(settings.speed ?? 2, 0.5, 6);

    await this.runEffectLoop(settings, Math.max(1800 / speed, 800), async () => {
        const color = this.mapColor(colors[Math.floor(Math.random() * colors.length)]);
        const brightness = clamp(160 + Math.round(Math.random() * 60), 60, 254);
        await this.applyStateToAllLights({ on: true, bri: brightness, ...color });
    });
  }

  private async runParty(settings: EffectSettings) {
    const colors = settings.colors?.length ? settings.colors : ['red', 'purple', 'blue'];
    const speed = clamp(settings.speed ?? 8, 1, 12);
    let index = 0;

    await this.runEffectLoop(settings, Math.max(300, Math.round(700 / speed)), async () => {
        const onState = index % 2 === 0;
        const color = this.mapColor(colors[index % colors.length]);
        await this.applyStateToAllLights({
          on: true,
          bri: onState ? 254 : 80,
          ...color,
        });
        index += 1;
    });
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

    await this.runEffectLoop(settings, Math.max(interval, 1000), async () => {
        step += 1;
        const progress = step / steps;
        const colorIndex = Math.min(palette.length - 1, Math.floor(progress * palette.length));
        const color = this.mapColor(palette[colorIndex]);
        const brightness = clamp(Math.round(progress * 254), 40, 254);
        await this.applyStateToAllLights({ on: true, bri: brightness, ...color });
        if (step >= steps) {
          await this.stopEffect();
        }
    });
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

    // stopEffect is already queued, but we call it here.
    // However, stopEffect calls getApi and setLightState which ARE queued.
    // So stopEffect logic runs:
    // 1. Clear timers (sync)
    // 2. Enqueue restore state.
    await this.stopEffect();
    await this.captureCurrentStates();

    // Runners call applyStateToAllLights which is queued.
    // They also start intervals.
    // We await runner to do initial setup.
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
        await this.enqueue(async () => {
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
                })
             );
        });
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
