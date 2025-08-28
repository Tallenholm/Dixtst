import { Request, Response } from 'express'
import { z } from 'zod'
import type { IStorage } from '../storage'
import { listOverrides, setRoomOverride, clearRoomOverride } from '../lib/overrides'

export class OverridesController {
  constructor(private readonly storage: IStorage) {}

  list = async (_req: Request, res: Response) => {
    const overrides = await listOverrides(this.storage)
    res.json({ overrides })
  }

  set = async (
    req: Request<{ roomId: string }, any, { on?: boolean; bri?: number; ct?: number; dnd?: boolean; until?: string; sceneId?: string }>,
    res: Response
  ) => {
    const bodySchema = z.object({
      on: z.boolean().optional(),
      bri: z.number().optional(),
      ct: z.number().optional(),
      dnd: z.boolean().optional(),
      until: z.string().optional(),
      sceneId: z.string().optional(),
    })
    const data = bodySchema.parse(req.body || {})
    await setRoomOverride(this.storage, String(req.params.roomId), data)
    res.json({ ok: true })
  }

  clear = async (req: Request<{ roomId: string }>, res: Response) => {
    await clearRoomOverride(this.storage, String(req.params.roomId))
    res.json({ ok: true })
  }
}
