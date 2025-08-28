import { RoomsRepository } from '../repositories/rooms'
import { PermissionsRepository } from '../repositories/permissions'

export class RoomsService {
  constructor(
    private readonly repo: RoomsRepository,
    private readonly permissions: PermissionsRepository,
  ) {}

  listRooms() {
    return this.repo.listRooms()
  }

  listScenes() {
    return this.repo.listScenes()
  }

  applyScene(roomId: string, sceneId: string) {
    return this.repo.applyScene(roomId, sceneId)
  }

  async toggleRoom(roomId: string, userId: string, isOn: boolean) {
    const allowed = await this.permissions.canToggleRoom(userId, roomId)
    if (!allowed) {
      throw new Error('forbidden')
    }
    const ids = await this.repo.getRoomLightIds(roomId)
    await Promise.all(ids.map((id) => this.repo.setLightState(id, { on: isOn })))
    return ids
  }
}
