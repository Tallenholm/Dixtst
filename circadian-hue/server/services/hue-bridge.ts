import { v3 } from 'node-hue-api';
import type { IStorage, Light } from '../storage';

function mapColor(name?: string): number | undefined {
  const colors: Record<string, number> = {
    warm: 400,
    orange: 400,
    red: 500,
    yellow: 300,
    blue: 200,
    cyan: 180,
    teal: 160,
    green: 180,
    purple: 470,
    pink: 460,
    rainbow: 350,
  };
  return name ? colors[name] : undefined;
}

export class HueBridgeService {
  private storage: IStorage;
  private effectTimer?: NodeJS.Timeout;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  private async getApi() {
    const bridge = await this.storage.getSetting<{ ip: string; username: string }>('bridge');
    if (!bridge) throw new Error('bridge_not_configured');
    return v3.api.createLocal(bridge.value.ip).connect(bridge.value.username);
  }

  async discover(): Promise<string[]> {
    const results = await v3.discovery.nupnpSearch();
    return results.map((b: any) => b.internalipaddress);
  }

  async pairWithLinkButton(ip: string): Promise<{ ip: string; username: string }> {
    const unauth = await v3.api.createLocal(ip).connect();
    try {
      const user = await unauth.users.createUser('circadian-hue#server');
      await this.storage.setSetting('bridge', { ip, username: user.username });
      return { ip, username: user.username };
    } catch (e: any) {
      if (e.getHueErrorType && e.getHueErrorType() === 101) {
        throw new Error('link_button_not_pressed');
      }
      throw e;
    }
  }

  async listRooms() {
    const api = await this.getApi();
    const groups = await api.groups.getAll();
    return groups
      .filter((g: any) => ['Room', 'Zone'].includes(g.type))
      .map((g: any) => ({ id: String(g.id), name: g.name, type: g.type, lights: (g.lights || []).map((l: any) => String(l)) }));
  }

  async listScenes() {
    const api = await this.getApi();
    if (!api.scenes) return [];
    const scenes = await api.scenes.getAll();
    return scenes.map((s: any) => ({ id: String(s.id), name: s.name, groupId: s.group || s.groupid || s.groupId }));
  }

  async applySceneToGroup(roomId: string, sceneId: string) {
    const api = await this.getApi();
    const st = new v3.lightStates.GroupLightState().scene(sceneId);
    await api.groups.setGroupState(roomId, st);
  }

  async getCurrentScene(roomId = '0'): Promise<string | null> {
    const api = await this.getApi();
    try {
      const g = await api.groups.getGroup(roomId);
      const sceneId = g?.state?.scene || g?.action?.scene;
      return sceneId ? String(sceneId) : null;
    } catch {
      return null;
    }
  }

  async getRoomLightIds(roomId: string) {
    const api = await this.getApi();
    const g = await api.groups.getGroup(roomId);
    return (g?.lights || []).map((l: any) => String(l));
  }

  async setLightState(id: string, state: { on?: boolean; bri?: number; ct?: number }) {
    const api = await this.getApi();
    const st = new v3.lightStates.LightState();
    if (state.on !== undefined) state.on ? st.on() : st.off();
    if (typeof state.bri === 'number') st.brightness(Math.max(1, Math.min(254, state.bri)));
    if (typeof state.ct === 'number') st.ct(Math.max(153, Math.min(500, state.ct)));
    await api.lights.setLightState(id, st);
  }

  async applyStateToAllLights(state: { on?: boolean; bri?: number; ct?: number }) {
    const api = await this.getApi();
    const st = new v3.lightStates.GroupLightState();
    if (state.on !== undefined) state.on ? st.on() : st.off();
    if (typeof state.bri === 'number') st.brightness(Math.max(1, Math.min(254, state.bri)));
    if (typeof state.ct === 'number') st.ct(Math.max(153, Math.min(500, state.ct)));
    try {
      await api.groups.setGroupState(0, st);
    } catch {
      const lights = await api.lights.getAll();
      await Promise.all(lights.map((l: any) => api.lights.setLightState(l.id, st)));
    }
  }

  async refreshLights(): Promise<Light[]> {
    const api = await this.getApi();
    const lights = await api.lights.getAll();
    return lights.map((l: any) => ({
      id: String(l.id),
      name: l.name,
      isOn: !!l.state.on,
      brightness: l.state.bri ?? 0,
      colorTemp: l.state.ct ?? 0,
      updatedAt: new Date(),
    }));
  }

  async startEffect(effectId: string, settings: { speed: number; intensity: number; colors?: string[]; duration?: number }) {
    await this.stopEffect();
    const bri = Math.round(Math.max(1, Math.min(254, (settings.intensity / 100) * 254)));
    const ct = mapColor(settings.colors?.[0]);
    await this.applyStateToAllLights({ on: true, bri, ct });
    if (settings.duration) {
      this.effectTimer = setTimeout(() => {
        this.stopEffect().catch(() => undefined);
      }, settings.duration * 1000);
    }
  }

  async stopEffect() {
    if (this.effectTimer) {
      clearTimeout(this.effectTimer);
      this.effectTimer = undefined;
    }
    // Return to a neutral white state
    await this.applyStateToAllLights({ on: true, bri: 150, ct: 350 });
  }
}
