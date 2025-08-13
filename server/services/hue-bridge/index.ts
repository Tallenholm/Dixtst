import type { Bridge, WSMessage } from '@shared/schema';
import type { IStorage } from '../../storage.ts';
import {
  discoverBridges,
  discover
} from './discovery.ts';
import {
  pairBridge,
  pairWithLinkButton
} from './pairing.ts';
import {
  refreshLights,
  setLightState,
  applyStateToAllLights,
  listRooms,
  getRoomLightIds,
  listScenes,
  applySceneToGroup,
  fetchLights,
  updateLight
} from './light-control.ts';

export class HueBridgeService {
  private storage: IStorage;
  private broadcastCallback?: (message: WSMessage) => void;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  setBroadcastCallback(callback: (message: WSMessage) => void) {
    this.broadcastCallback = callback;
  }

  discoverBridges() { return discoverBridges(this.storage); }
  discover() { return discover(this.storage); }
  pairBridge(bridge: Bridge) { return pairBridge(this.storage, bridge); }
  pairWithLinkButton(ip: string, appName = 'circadian-hue', deviceName = 'server') {
    return pairWithLinkButton(this.storage, ip, appName, deviceName);
  }
  refreshLights() { return refreshLights(this.storage); }
  setLightState(lightId: string, state: { on?: boolean; bri?: number; ct?: number }) {
    return setLightState(this.storage, lightId, state);
  }
  applyStateToAllLights(state: { on?: boolean; bri?: number; ct?: number }) {
    return applyStateToAllLights(this.storage, state);
  }
  listRooms() { return listRooms(this.storage); }
  getRoomLightIds(roomId: string) { return getRoomLightIds(this.storage, roomId); }
  listScenes() { return listScenes(this.storage); }
  applySceneToGroup(groupId: string, sceneId: string) {
    return applySceneToGroup(this.storage, groupId, sceneId);
  }
  fetchLights(bridge: Bridge) {
    return fetchLights(this.storage, bridge, this.broadcastCallback);
  }
  updateLight(bridge: Bridge, lightId: string, state: { on?: boolean; brightness?: number; colorTemp?: number }) {
    return updateLight(this.storage, bridge, lightId, state, this.broadcastCallback);
  }
}

export {
  discoverBridges,
  discover,
  pairBridge,
  pairWithLinkButton,
  refreshLights,
  setLightState,
  applyStateToAllLights,
  listRooms,
  getRoomLightIds,
  listScenes,
  applySceneToGroup,
  fetchLights,
  updateLight,
};
export * from './errors.ts';
