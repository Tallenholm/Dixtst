import { Request, Response } from 'express'
import type { IStorage } from '../storage'
import { error } from '../lib/error'

const LOCATION_DETECT_URL = process.env.IPAPI_ENDPOINT
const LOCATION_DETECT_TIMEOUT_MS = 5000

export class LocationController {
  constructor(private readonly storage: IStorage) {
    if (!LOCATION_DETECT_URL) throw new Error('IPAPI_ENDPOINT is required')
  }

  get = async (_req: Request, res: Response) => {
    const loc = await this.storage.getSetting<{
      latitude: number
      longitude: number
      city?: string
      country?: string
    }>('location')
    if (!loc)
      return res.status(404).json(error('location_not_set', 'Location not set'))
    res.json(loc.value)
  }

  set = async (
    req: Request<
      any,
      any,
      { latitude: number; longitude: number; city?: string; country?: string }
    >,
    res: Response,
  ) => {
    const value = req.body
    await this.storage.setSetting('location', value)
    res.json(value)
  }

  detect = async (_req: Request, res: Response) => {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      LOCATION_DETECT_TIMEOUT_MS,
    )
    try {
      const r = await fetch(LOCATION_DETECT_URL!, { signal: controller.signal })
      const data = await r.json()
      const value = {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
      }
      await this.storage.setSetting('location', value)
      res.json(value)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      res.status(503).json(error('location_service_unavailable', message))
    } finally {
      clearTimeout(timeout)
    }
  }
}
