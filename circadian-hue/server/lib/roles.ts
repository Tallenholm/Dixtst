import { Request, Response, NextFunction } from 'express'
import { TokenPayload } from './auth'

export function requireRoomRole(param = 'roomId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as TokenPayload | undefined
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    const roomId = req.params[param]
    const required = `room:${roomId}`
    if (user.roles.includes('admin') || user.roles.includes(required)) {
      return next()
    }
    return res.status(403).json({ error: 'forbidden' })
  }
}
