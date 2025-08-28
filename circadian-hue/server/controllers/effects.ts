import { Request, Response } from 'express'
import type { HueBridgeService } from '../services/hue-bridge'

export class EffectsController {
  constructor(private readonly hueBridge: HueBridgeService) {}

  sleepMode = async (_req: Request, res: Response) => {
    await this.hueBridge.applyStateToAllLights({ on: true, bri: 40, ct: 430 })
    res.json({ ok: true })
  }

  wakeUp = async (_req: Request, res: Response) => {
    await this.hueBridge.applyStateToAllLights({ on: true, bri: 200, ct: 220 })
    res.json({ ok: true })
  }

  start = async (
    req: Request<any, any, { effectId?: string; settings?: { speed: number; intensity: number } }>,
    res: Response
  ) => {
    const { effectId, settings } = req.body || {}
    if (!effectId) return res.status(400).json({ error: 'effectId required' })
    await this.hueBridge.startEffect(effectId, settings || { speed: 5, intensity: 80 })
    res.json({ ok: true })
  }

  stop = async (_req: Request, res: Response) => {
    await this.hueBridge.stopEffect()
    res.json({ ok: true })
  }
}
