import { Request, Response } from 'express'
import { RoomsService } from '../services/rooms'
import {
  ApplySceneRequest,
  ApplySceneRequestSchema,
  ToggleRoomRequest,
  ToggleRoomRequestSchema,
} from '../../shared/dto/room'
import { validate } from '../../shared/dto/validate'

export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  listRooms = async (_req: Request, res: Response) => {
    const rooms = await this.service.listRooms()
    res.json({ rooms })
  }

  listScenes = async (_req: Request, res: Response) => {
    const scenes = await this.service.listScenes()
    res.json({ scenes })
  }

  applyScene = async (
    req: Request<{ roomId: string }, any, ApplySceneRequest>,
    res: Response
  ) => {
    const { roomId } = req.params
    const { sceneId } = validate(ApplySceneRequestSchema, req.body)
    await this.service.applyScene(roomId, sceneId)
    res.json({ ok: true })
  }

  toggleRoom = async (
    req: Request<{ roomId: string }, any, ToggleRoomRequest>,
    res: Response
  ) => {
    const { roomId } = req.params
    const { isOn } = validate(ToggleRoomRequestSchema, req.body || {})
    const ids = await this.service.toggleRoom(roomId, !!isOn)
    res.json({ ok: true, ids })
  }
}
