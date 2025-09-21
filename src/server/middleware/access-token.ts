import type { Request, Response, NextFunction } from 'express';

export function createAccessControl() {
  const token = process.env.ACCESS_TOKEN;
  if (!token) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return (req: Request, res: Response, next: NextFunction) => {
    const provided = (req.headers['x-access-token'] || req.headers['authorization']) as string | undefined;
    if (provided && provided.replace(/^Bearer\s+/i, '') === token) {
      return next();
    }
    res.status(401).json({ error: 'unauthorized', message: 'Access token required' });
  };
}
