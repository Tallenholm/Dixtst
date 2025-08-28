import { Request, Response } from 'express'
import { z } from 'zod'
import { RoomsService } from '../services/rooms'

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
    req: Request<{ roomId: string }, any, { sceneId: string }>,
    res: Response
  ) => {
    const { roomId } = req.params
    const { sceneId } = z.object({ sceneId: z.string() }).parse(req.body)
    await this.service.applyScene(roomId, sceneId)
    res.json({ ok: true })
  }

  toggleRoom = async (
    req: Request<{ roomId: string }, any, { isOn?: boolean }>,
    res: Response
  ) => {
    const { roomId } = req.params
    const isOn = !!req.body?.isOn
    const ids = await this.service.toggleRoom(roomId, isOn)
    res.json({ ok: true, ids })
  }
}
