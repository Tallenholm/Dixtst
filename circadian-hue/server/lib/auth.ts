import type { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../services/jwt'
export type { TokenPayload } from '../services/jwt'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const token = header.substring(7)
  try {
    const payload = verifyToken(token)
    ;(req as any).user = payload
    return next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}
