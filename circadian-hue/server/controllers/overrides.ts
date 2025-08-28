import { Request, Response } from 'express'
import type { IStorage } from '../storage'
import { listOverrides, setRoomOverride, clearRoomOverride } from '../lib/overrides'
import { OverrideRequest, OverrideRequestSchema } from '../../shared/dto/overrides'
import { validate } from '../../shared/dto/validate'

export class OverridesController {
  constructor(private readonly storage: IStorage) {}

  list = async (_req: Request, res: Response) => {
    const overrides = await listOverrides(this.storage)
    res.json({ overrides })
  }

  set = async (
    req: Request<{ roomId: string }, any, OverrideRequest>,
    res: Response
  ) => {
    const data = validate(OverrideRequestSchema, req.body || {})
    await setRoomOverride(this.storage, String(req.params.roomId), data)
    res.json({ ok: true })
  }

  clear = async (req: Request<{ roomId: string }>, res: Response) => {
    await clearRoomOverride(this.storage, String(req.params.roomId))
    res.json({ ok: true })
  }
}
