import pino from 'pino'
import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'

const redact = () => '[redacted]'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    token: redact,
    accessToken: redact,
    refreshToken: redact,
    userId: redact,
    req(req: Request) {
      const { headers, ...rest } = req
      const h = { ...headers }
      if (h.authorization) h.authorization = '[redacted]'
      return { ...rest, headers: h }
    },
  },
})

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID()
  ;(req as any).id = reqId
  const child = logger.child({ reqId })
  ;(req as any).log = child
  res.on('finish', () => {
    child.info(
      { res: { statusCode: res.statusCode } },
      `${req.method} ${req.url}`,
    )
  })
  next()
}

export default logger
