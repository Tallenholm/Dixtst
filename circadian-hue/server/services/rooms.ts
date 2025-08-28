import { RoomsRepository } from '../repositories/rooms'

export class RoomsService {
  constructor(private readonly repo: RoomsRepository) {}

  listRooms() {
    return this.repo.listRooms()
  }

  listScenes() {
    return this.repo.listScenes()
  }

  applyScene(roomId: string, sceneId: string) {
    return this.repo.applyScene(roomId, sceneId)
  }

  async toggleRoom(roomId: string, isOn: boolean) {
    const ids = await this.repo.getRoomLightIds(roomId)
    await Promise.all(ids.map((id) => this.repo.setLightState(id, { on: isOn })))
    return ids
  }
}
