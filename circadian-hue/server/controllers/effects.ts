import { Request, Response } from 'express'
import type { HueBridgeService } from '../services/hue-bridge'
import { AnalyticsService } from '../services/analytics'
import { error } from '../lib/error'

export class EffectsController {
  constructor(
    private readonly hueBridge: HueBridgeService,
    private readonly analytics: AnalyticsService,
  ) {}

  sleepMode = async (_req: Request, res: Response) => {
    await this.hueBridge.applyStateToAllLights({ on: true, bri: 40, ct: 430 })
    res.json({ ok: true })
  }

  wakeUp = async (_req: Request, res: Response) => {
    await this.hueBridge.applyStateToAllLights({ on: true, bri: 200, ct: 220 })
    res.json({ ok: true })
  }

  start = async (
    req: Request<
      any,
      any,
      {
        effectId?: string
        settings?: {
          speed?: number
          intensity?: number
          colors?: string[]
          duration?: number
        }
      }
    >,
    res: Response,
  ) => {
    const { effectId, settings } = req.body || {}
    if (!effectId)
      return res
        .status(400)
        .json(error('effect_id_required', 'effectId required'))
    await this.hueBridge.startEffect(effectId, settings || {})
    await this.analytics.recordEvent('effect_start', { effectId, settings })
    res.json({ ok: true })
  }

  stop = async (_req: Request, res: Response) => {
    await this.hueBridge.stopEffect()
    await this.analytics.recordEvent('effect_stop')
    res.json({ ok: true })
  }
}
