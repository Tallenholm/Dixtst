import { Request, Response } from 'express'
import { getSunTimes, getCurrentPhase } from '../lib/sun'

export class SunController {
  getSunTimes = (req: Request<unknown, unknown, unknown, { lat: string; lng: string }>, res: Response) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const t = getSunTimes(lat, lng)
    res.json(t)
  }

  getCurrentPhase = (req: Request<unknown, unknown, unknown, { lat: string; lng: string }>, res: Response) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    res.json({ phase: getCurrentPhase(lat, lng) })
  }
}
