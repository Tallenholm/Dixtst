import { Request, Response } from 'express'
import type { IStorage } from '../storage'
import { PermissionsRepository } from '../repositories/permissions'
import { getSunTimes, getCurrentPhase } from '../lib/sun'

export class ScheduleController {
  constructor(
    private readonly storage: IStorage,
    private readonly permissions: PermissionsRepository,
  ) {}

  sunTimes = (req: Request<unknown, unknown, unknown, { lat: string; lng: string }>, res: Response) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const t = getSunTimes(lat, lng)
    res.json(t)
  }

  currentPhase = (req: Request<unknown, unknown, unknown, { lat: string; lng: string }>, res: Response) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    res.json({ phase: getCurrentPhase(lat, lng) })
  }

  list = async (_req: Request, res: Response) => {
    const sc = await this.storage.getSetting<any[]>('schedule')
    res.json({ schedules: sc?.value || [] })
  }

  set = async (req: Request<any, any, { schedules?: any[] }>, res: Response) => {
    const userId = (req as any).user?.userId as string
    if (!userId || !(await this.permissions.canSchedule(userId))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    const schedules = req.body?.schedules
    if (!Array.isArray(schedules)) return res.status(400).json({ error: 'schedules array required' })
    await this.storage.setSetting('schedule', schedules)
    res.json({ schedules })
  }

  patch = async (req: Request<{ id: string }>, res: Response) => {
    const userId = (req as any).user?.userId as string
    if (!userId || !(await this.permissions.canSchedule(userId))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    const id = req.params.id
    const existing = (await this.storage.getSetting<any[]>('schedule'))?.value || []
    const idx = existing.findIndex((s: any) => s.id === id)
    if (idx === -1) return res.status(404).json({ error: 'schedule_not_found' })
    existing[idx] = { ...existing[idx], ...req.body }
    await this.storage.setSetting('schedule', existing)
    res.json(existing[idx])
  }
}
