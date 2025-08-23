import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET is required');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = header.substring(7);
  try {
    const payload = jwt.verify(token, SECRET);
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
