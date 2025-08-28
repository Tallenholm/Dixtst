import { HueBridgeService } from '../services/hue-bridge'

export class RoomsRepository {
  constructor(private readonly hueBridge: HueBridgeService) {}

  listRooms() {
    return this.hueBridge.listRooms()
  }

  listScenes() {
    return this.hueBridge.listScenes()
  }

  applyScene(roomId: string, sceneId: string) {
    return this.hueBridge.applySceneToGroup(roomId, sceneId)
  }

  getRoomLightIds(roomId: string) {
    return this.hueBridge.getRoomLightIds(roomId)
  }

  setLightState(id: string, state: { on: boolean }) {
    return this.hueBridge.setLightState(id, state)
  }
}
