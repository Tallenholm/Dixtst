import { Request, Response } from 'express'
import { HueBridgeService } from '../services/hue-bridge'

export class BridgesController {
  constructor(private readonly hueBridge: HueBridgeService) {}

  list = async (_req: Request, res: Response) => {
    const ips = await this.hueBridge.discover()
    const bridges = ips.map((ip: string, idx: number) => ({ id: ip, ip, name: `Hue Bridge ${idx + 1}` }))
    res.json(bridges)
  }

  discover = async (_req: Request, res: Response) => {
    const ips = await this.hueBridge.discover()
    res.json({ ips })
  }

  pair = async (req: Request<{ bridgeId: string }>, res: Response) => {
    const ip = req.params.bridgeId
    try {
      const r = await this.hueBridge.pairWithLinkButton(ip)
      res.json({ paired: true, auth: r })
    } catch (e: any) {
      if (e.message === 'link_button_not_pressed') return res.status(428).json({ error: 'link_button_not_pressed' })
      throw e
    }
  }
}
