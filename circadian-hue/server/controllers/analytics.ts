import { Request, Response } from 'express'
import { AnalyticsService } from '../services/analytics'

export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  get = async (_req: Request, res: Response) => {
    const data = await this.analytics.getAnalytics()
    res.json(data)
  }
}
