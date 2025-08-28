import { RoomsRepository } from '../repositories/rooms'
import { PermissionsRepository } from '../repositories/permissions'
import { AnalyticsService } from './analytics'

export class RoomsService {
  constructor(
    private readonly repo: RoomsRepository,
    private readonly permissions: PermissionsRepository,
    private readonly analytics: AnalyticsService,
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
    await this.analytics.recordEvent(isOn ? 'light_on' : 'light_off', { roomId, lightIds: ids, userId })
    await this.analytics.recordEvent('manual_override', { roomId, lightIds: ids, userId })
    return ids
  }
}
