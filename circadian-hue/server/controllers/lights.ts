import { Request, Response } from 'express'
import type { HueBridgeService } from '../services/hue-bridge'

export class LightsController {
  constructor(private readonly hueBridge: HueBridgeService) {}

  list = async (_req: Request, res: Response) => {
    const lights = await this.hueBridge.refreshLights()
    res.json(lights)
  }

  currentScene = async (_req: Request, res: Response) => {
    const current = await this.hueBridge.getCurrentScene()
    res.json({ current })
  }

  applyScene = async (
    req: Request<any, any, { sceneId?: string; presetId?: string }>,
    res: Response
  ) => {
    const { sceneId, presetId } = req.body || {}
    if (sceneId) {
      await this.hueBridge.applySceneToGroup('0', sceneId)
      return res.json({ ok: true })
    }
    const presets: Record<string, { bri: number; ct: number }> = {
      relax: { bri: 90, ct: 400 },
      focus: { bri: 200, ct: 220 },
      evening_warm: { bri: 120, ct: 370 },
      nightlight: { bri: 40, ct: 430 },
    }
    const st = presets[presetId ?? ''] || { bri: 150, ct: 300 }
    await this.hueBridge.applyStateToAllLights({ on: true, bri: st.bri, ct: st.ct })
    res.json({ ok: true })
  }
}
