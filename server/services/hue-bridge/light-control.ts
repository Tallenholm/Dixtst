import { v3 } from './hue-api.ts';
import type { Bridge, WSMessage, Light } from '@shared/schema';
import type { IStorage } from '../../storage.ts';
import logger from '../../logger.ts';
import { logError } from './errors.ts';

async function getApi(storage: IStorage): Promise<{ api: any; bridge: Bridge }> {
  const bridges = await storage.getAllBridges();
  const bridge = bridges[0];
  if (!bridge) throw new Error('bridge_not_configured');
  const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
  return { api, bridge };
}

/** Compatibility method returning simplified light objects. */
export async function refreshLights(storage: IStorage) {
  const { api } = await getApi(storage);
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

export async function setLightState(
  storage: IStorage,
  lightId: string,
  state: { on?: boolean; bri?: number; ct?: number }
) {
  const { api } = await getApi(storage);
  const st = new v3.lightStates.LightState();
  if (state.on !== undefined) state.on ? st.on() : st.off();
  if (typeof state.bri === 'number') st.brightness(Math.max(1, Math.min(254, state.bri)));
  if (typeof state.ct === 'number') st.ct(Math.max(153, Math.min(500, state.ct)));
  return api.lights.setLightState(lightId, st);
}

export async function applyStateToAllLights(
  storage: IStorage,
  state: { on?: boolean; bri?: number; ct?: number }
) {
  const { api } = await getApi(storage);
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

export async function listRooms(storage: IStorage) {
  const { api } = await getApi(storage);
  const groups = await api.groups.getAll();
  return groups
    .filter((g: any) => ['Room', 'Zone'].includes(g.type))
    .map((g: any) => ({ id: String(g.id), name: g.name, type: g.type, lights: (g.lights || []).map((l: any) => String(l)) }));
}

export async function getRoomLightIds(storage: IStorage, roomId: string) {
  const { api } = await getApi(storage);
  const g = await api.groups.getGroup(roomId);
  return (g?.lights || []).map((l: any) => String(l));
}

export async function listScenes(storage: IStorage) {
  const { api } = await getApi(storage);
  if (!api.scenes) return [];
  const scenes = await api.scenes.getAll();
  return scenes.map((s: any) => ({ id: String(s.id), name: s.name, groupId: s.group || s.groupid || s.groupId }));
}

export async function applySceneToGroup(storage: IStorage, groupId: string, sceneId: string) {
  const { api } = await getApi(storage);
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
export async function fetchLights(
  storage: IStorage,
  bridge: Bridge,
  broadcastCallback?: (message: WSMessage) => void
): Promise<Light[]> {
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
      await storage.upsertLight(light);
      mapped.push(light);
      broadcastCallback?.({ type: 'light_update', data: light });
    }
    return mapped;
  } catch (err) {
    logError('Failed to fetch lights', err);
    return [];
  }
}

/** Update an individual light on the bridge. */
export async function updateLight(
  storage: IStorage,
  bridge: Bridge,
  lightId: string,
  state: { on?: boolean; brightness?: number; colorTemp?: number },
  broadcastCallback?: (message: WSMessage) => void
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

    const existing = await storage.getLightById(lightId);
    const updated: Light = {
      ...(existing as Light),
      id: lightId,
      bridgeId: bridge.id,
      isOn: state.on ?? existing?.isOn ?? false,
      brightness: state.brightness ?? existing?.brightness ?? 0,
      colorTemp: state.colorTemp ?? existing?.colorTemp ?? 0
    } as Light;
    await storage.upsertLight(updated);
    broadcastCallback?.({ type: 'light_update', data: updated });
    return true;
  } catch (err) {
    logError('Failed to update light', err);
    return false;
  }
}

export { getApi };
