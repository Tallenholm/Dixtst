import { Request, Response } from 'express'
import { rollVibe } from '../lib/vibe'
import type { HueBridgeService } from '../services/hue-bridge'

export class VibeController {
  constructor(private readonly hueBridge: HueBridgeService) {}

  roll = async (
    req: Request<any, any, { seed?: number; warmth?: number; intensity?: number }>,
    res: Response
  ) => {
    const { seed, warmth, intensity } = req.body || {}
    const v = rollVibe({ seed, warmth, intensity })
    const bri = Math.max(1, Math.min(254, v.bri))
    const ct = Math.max(153, Math.min(500, v.ct))
    await this.hueBridge.applyStateToAllLights({ on: true, bri, ct })
    res.json({ applied: { ...v, bri, ct } })
  }
}
