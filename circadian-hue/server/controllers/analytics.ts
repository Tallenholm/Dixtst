import { Request, Response } from 'express'
import type { IStorage } from '../storage'
import { getSunTimes } from '../lib/sun'

export class AnalyticsController {
  constructor(private readonly storage: IStorage) {}

  get = async (_req: Request, res: Response) => {
    const loc = await this.storage.getSetting<{ latitude: number; longitude: number }>('location')
    let phaseDistribution: { phase: string; hours: number; percentage: number }[] = []
    if (loc) {
      const sun = getSunTimes(loc.value.latitude, loc.value.longitude)
      const sunrise = new Date(sun.sunrise)
      const sunset = new Date(sun.sunset)
      const dayHours = (sunset.getTime() - sunrise.getTime()) / 36e5
      const sunriseHours = 1
      const eveningHours = 1
      const day = Math.max(dayHours - sunriseHours - eveningHours, 0)
      const night = Math.max(24 - day - sunriseHours - eveningHours, 0)
      phaseDistribution = [
        { phase: 'Night', hours: night, percentage: Math.round((night / 24) * 100) },
        { phase: 'Sunrise', hours: sunriseHours, percentage: Math.round((sunriseHours / 24) * 100) },
        { phase: 'Day', hours: day, percentage: Math.round((day / 24) * 100) },
        { phase: 'Evening', hours: eveningHours, percentage: Math.round((eveningHours / 24) * 100) },
      ]
    }
    res.json({
      todayUsage: { totalHours: 0, circadianHours: 0, manualOverrides: 0, energySaved: 0 },
      weeklyTrends: [],
      phaseDistribution,
      healthMetrics: { circadianScore: 0, sleepScheduleConsistency: 0, lightExposureBalance: 0, wellnessIndex: 0 },
    })
  }
}
