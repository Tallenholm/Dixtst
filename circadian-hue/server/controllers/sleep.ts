import { Request, Response } from 'express'
import type { HueBridgeService } from '../services/hue-bridge'
import type { Scheduler } from '../services/scheduler'
import logger from '../lib/logger'
import { sunriseQueue } from '../services/jobs'
import { error } from '../lib/error'

export class SleepController {
  constructor(
    private readonly hueBridge: HueBridgeService,
    private readonly scheduler: Scheduler,
  ) {}

  nightlight = async (_req: Request, res: Response) => {
    await this.hueBridge.applyStateToAllLights({ on: true, bri: 30, ct: 430 })
    res.json({ ok: true })
  }

  winddown = async (
    req: Request<any, any, { minutes?: number }>,
    res: Response,
  ) => {
    const minutes = Math.max(5, Math.min(120, Number(req.body?.minutes ?? 30)))
    const steps = minutes
    let i = 0
    const startBri = 150,
      endBri = 30
    const startCt = 350,
      endCt = 430
    const id = 'winddown'
    let errors = 0
    const lights = await this.hueBridge.refreshLights()
    const prev = lights[0]
      ? { on: lights[0].isOn, bri: lights[0].brightness, ct: lights[0].colorTemp }
      : undefined
    this.scheduler.scheduleInterval(
      id,
      async () => {
        i++
        const t = Math.min(1, i / steps)
        const bri = Math.round(startBri * (1 - t) + endBri * t)
        const ct = Math.round(startCt * (1 - t) + endCt * t)
        try {
          await this.hueBridge.applyStateToAllLights({ on: true, bri, ct })
          errors = 0
        } catch (err) {
          errors++
          logger.error({ err }, 'winddown interval failed')
          if (errors >= 5) {
            this.scheduler.clear(id)
            if (prev) await this.hueBridge.applyStateToAllLights(prev)
          }
        }
        if (i >= steps) this.scheduler.clear(id)
      },
      60 * 1000,
    )
    res.json({ ok: true, minutes })
  }

  sunrise = async (
    req: Request<any, any, { minutes?: number }>,
    res: Response,
  ) => {
    const minutes = Math.max(5, Math.min(90, Number(req.body?.minutes ?? 30)))
    if (sunriseQueue) {
      await sunriseQueue.add('sunrise', { minutes })
      res.status(202).json({ ok: true, minutes })
    } else {
      logger.warn('sunrise queue not configured')
      res.status(500).json(error('queue_unavailable', 'queue unavailable'))
    }
  }
}
