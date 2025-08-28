import { Request, Response } from 'express'
import type { IStorage } from '../storage'
import logger from '../lib/logger'
import { analyticsQueue } from '../services/jobs'

export class AnalyticsController {
  constructor(private readonly storage: IStorage) {}

  get = async (_req: Request, res: Response) => {
    if (analyticsQueue) {
      const job = await analyticsQueue.add('generate', {})
      res.status(202).json({ jobId: job.id })
    } else {
      logger.warn('analytics queue not configured')
      res.status(500).json({ error: 'queue unavailable' })
    }
  }
}
