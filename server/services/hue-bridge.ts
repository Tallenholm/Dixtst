import { v3 } from 'node-hue-api';
import type { Bridge, WSMessage, Light } from '@shared/schema';
import type { IStorage } from '../storage';
import logger from '../logger';

function isHueApiError(err: unknown): err is Error & { getHueErrorType(): number } {
  return err instanceof Error && typeof (err as any).getHueErrorType === 'function';
}

export class HueBridgeService {
  private storage: IStorage;
  private broadcastCallback?: (message: WSMessage) => void;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  setBroadcastCallback(callback: (message: WSMessage) => void) {
    this.broadcastCallback = callback;
  }

  /**
   * Discover Hue Bridges via cloud (N-UPnP) and local (UPnP/SSDP).
   */
  async discoverBridges(): Promise<Bridge[]> {
    logger.info('Starting Hue Bridge discovery');
    let candidates: Record<string, string> = {};

    try {
      const cloud = await v3.discovery.nupnpSearch();
      logger.info('N-UPnP results', { count: cloud.length });
      cloud.forEach(b => { candidates[b.id] = b.internalipaddress; });
    } catch (err) {
      logger.warn('N-UPnP discovery failed', err);
    }

    try {
      const local = await v3.discovery.upnpSearch();
      logger.info('UPnP results', { count: local.length });
      local.forEach(b => { candidates[b.id] = b.internalipaddress; });
    } catch (err) {
      logger.warn('UPnP discovery failed', err);
    }

    const bridges: Bridge[] = [];
    for (const [id, ip] of Object.entries(candidates)) {
      let existing = await this.storage.getBridgeById(id);
      if (existing) {
        existing.ip = ip;
        existing.isConnected = true;
        existing.lastSeen = new Date();
        await this.storage.updateBridge(existing);
        bridges.push(existing);
      } else {
        const newBridge = await this.storage.insertBridge({
          id,
          ip,
          username: '',
          isConnected: false,
        });
        bridges.push(newBridge);
      }
    }

    if (bridges.length === 0) {
      logger.warn('No Hue Bridges found on network');
    }

    return bridges;
  }

  /** Convenience wrapper used by older routes – returns a list of IPs only. */
  async discover(): Promise<string[]> {
    const bridges = await this.discoverBridges();
    return bridges.map(b => b.ip);
  }

  /**
   * Pair with a Hue Bridge by pressing its link button.
   * Throws if button not pressed.
   */
  async pairBridge(bridge: Bridge): Promise<boolean> {
    logger.info('Attempting to pair with bridge', { bridgeId: bridge.id, ip: bridge.ip });
    try {
      const unauth = await v3.api.createLocal(bridge.ip).connect();
      const user = await unauth.users.createUser('circadian-hue#server');
      logger.info('Paired successfully', { username: user.username });
      bridge.username = user.username;
      bridge.isConnected = true;
      bridge.lastSeen = new Date();
      await this.storage.updateBridge(bridge);
      return true;
    } catch (err: unknown) {
      if (isHueApiError(err)) {
        if (err.getHueErrorType() === 101) {
          logger.warn('Link button not pressed, pairing aborted');
          throw new Error('Please press the Hue Bridge link button and retry pairing.');
        }
        logger.error('Hue API error during pairing', {
          hueErrorType: err.getHueErrorType(),
          message: err.message,
        });
      } else if (err instanceof Error) {
        logger.error('Unexpected error during pairing', { message: err.message });
      } else {
        logger.error('Unexpected non-error during pairing', err);
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /** Pair with a bridge using the traditional link button flow. */
  async pairWithLinkButton(ip: string, appName = 'circadian-hue', deviceName = 'server'): Promise<{ ip: string; username: string }> {
    const unauth = await v3.api.createLocal(ip).connect();
    try {
      const user = await unauth.users.createUser(appName, deviceName);
      await this.storage.insertBridge({ id: ip, ip, username: user.username, isConnected: true });
      return { ip, username: user.username };
    } catch (e: any) {
      if (isHueApiError(e) && e.getHueErrorType() === 101) {
        throw new Error('link_button_not_pressed');
      }
      throw e;
    }
  }

  private async getApi(): Promise<{ api: any; bridge: Bridge }> {
    const bridges = await this.storage.getAllBridges();
    const bridge = bridges[0];
    if (!bridge) throw new Error('bridge_not_configured');
    const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
    return { api, bridge };
  }

  /** Compatibility method returning simplified light objects. */
  async refreshLights() {
    const { api } = await this.getApi();
    const lights = await api.lights.getAll();
    return lights.map((l: any) => ({
      id: String(l.id),
      name: l.name,
      isOn: !!l.state.on,
      brightness: l.state.bri ?? 0,
      colorTemp: l.state.ct ?? 0,
      updatedAt: new Date()
    }));
  }

  async setLightState(lightId: string, state: { on?: boolean; bri?: number; ct?: number }) {
    const { api } = await this.getApi();
    const st = new v3.lightStates.LightState();
    if (state.on !== undefined) state.on ? st.on() : st.off();
    if (typeof state.bri === 'number') st.brightness(Math.max(1, Math.min(254, state.bri)));
    if (typeof state.ct === 'number') st.ct(Math.max(153, Math.min(500, state.ct)));
    return api.lights.setLightState(lightId, st);
  }

  async applyStateToAllLights(state: { on?: boolean; bri?: number; ct?: number }) {
    const { api } = await this.getApi();
    const st = new v3.lightStates.GroupLightState();
    if (state.on !== undefined) state.on ? st.on() : st.off();
    if (typeof state.bri === 'number') st.brightness(Math.max(1, Math.min(254, state.bri)));
    if (typeof state.ct === 'number') st.ct(Math.max(153, Math.min(500, state.ct)));
    try {
      await api.groups.setGroupState(0, st);
      return true;
    } catch {
      const lights = await api.lights.getAll();
      for (const l of lights) {
        await api.lights.setLightState(l.id, st);
      }
      return true;
    }
  }

  async listRooms() {
    const { api } = await this.getApi();
    const groups = await api.groups.getAll();
    return groups
      .filter((g: any) => ['Room', 'Zone'].includes(g.type))
      .map((g: any) => ({ id: String(g.id), name: g.name, type: g.type, lights: (g.lights || []).map((l: any) => String(l)) }));
  }

  async getRoomLightIds(roomId: string) {
    const { api } = await this.getApi();
    const g = await api.groups.getGroup(roomId);
    return (g?.lights || []).map((l: any) => String(l));
  }

  async listScenes() {
    const { api } = await this.getApi();
    if (!api.scenes) return [];
    const scenes = await api.scenes.getAll();
    return scenes.map((s: any) => ({ id: String(s.id), name: s.name, groupId: s.group || s.groupid || s.groupId }));
  }

  async applySceneToGroup(groupId: string, sceneId: string) {
    const { api } = await this.getApi();
    const st = new v3.lightStates.GroupLightState().scene(sceneId);
    try {
      await api.groups.setGroupState(groupId, st);
      return true;
    } catch {
      if (api.scenes?.activateScene) {
        await api.scenes.activateScene(sceneId);
        return true;
      }
      throw new Error('scene_apply_failed');
    }
  }

  /** Fetch all lights from a bridge and persist them to storage. */
  async fetchLights(bridge: Bridge): Promise<Light[]> {
    logger.info('Fetching lights for bridge', { bridgeId: bridge.id });
    try {
      const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
      const lights = await api.lights.getAll();
      const mapped: Light[] = [];
      for (const l of lights) {
        const light: Light = {
          id: String(l.id),
          bridgeId: bridge.id,
          name: l.name,
          type: l.type,
          modelId: l.modelid,
          isOn: !!l.state.on,
          brightness: l.state.bri ?? 0,
          colorTemp: l.state.ct ?? 0,
          hue: l.state.hue ?? null,
          saturation: l.state.sat ?? null,
          isCircadianControlled: true,
          manualOverride: false,
          manualOverrideUntil: null
        } as Light;
        await this.storage.upsertLight(light);
        mapped.push(light);
        this.broadcastCallback?.({ type: 'light_update', data: light });
      }
      return mapped;
    } catch (err) {
      logger.error('Failed to fetch lights', { bridgeId: bridge.id, err });
      return [];
    }
  }

  /** Update an individual light on the bridge. */
  async updateLight(
    bridge: Bridge,
    lightId: string,
    state: { on?: boolean; brightness?: number; colorTemp?: number }
  ): Promise<boolean> {
    logger.info('Updating light', { bridgeId: bridge.id, lightId, state });
    try {
      const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
      const lightState = new v3.lightStates.LightState();
      if (state.on !== undefined) {
        state.on ? lightState.on() : lightState.off();
      }
      if (typeof state.brightness === 'number') {
        const bri = Math.max(1, Math.min(254, Math.round(state.brightness)));
        lightState.brightness(bri);
      }
      if (typeof state.colorTemp === 'number') {
        const ct = Math.max(153, Math.min(500, Math.round(state.colorTemp)));
        lightState.ct(ct);
      }
      await api.lights.setLightState(lightId, lightState);

      const existing = await this.storage.getLightById(lightId);
      const updated: Light = {
        ...(existing as Light),
        id: lightId,
        bridgeId: bridge.id,
        isOn: state.on ?? existing?.isOn ?? false,
        brightness: state.brightness ?? existing?.brightness ?? 0,
        colorTemp: state.colorTemp ?? existing?.colorTemp ?? 0
      } as Light;
      await this.storage.upsertLight(updated);
      this.broadcastCallback?.({ type: 'light_update', data: updated });
      return true;
    } catch (err) {
      logger.error('Failed to update light', { bridgeId: bridge.id, lightId, err });
      return false;
    }
  }
}
