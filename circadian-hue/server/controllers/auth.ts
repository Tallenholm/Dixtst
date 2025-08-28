import { Request, Response } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { AuthRepository } from '../repositories/auth'

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  throw new Error('JWT_SECRET is required')
}

export class AuthController {
  private repo: AuthRepository

  constructor(repo: AuthRepository) {
    this.repo = repo
  }

  async login(req: Request, res: Response) {
    const { userId, roles, householdId } = req.body || {}
    // TODO: Implement proper credential check
    if (!userId || !Array.isArray(roles)) {
      return res.status(400).json({ error: 'invalid_credentials' })
    }

    const payload = { userId, roles, householdId }
    const accessToken = jwt.sign(payload, SECRET, { expiresIn: '15m' })
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    await this.repo.saveRefreshToken({ userId, roles, householdId, tokenHash: refreshHash })
    res.json({ accessToken, refreshToken })
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body || {}
    if (!refreshToken) {
      return res.status(400).json({ error: 'missing_token' })
    }
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const data = await this.repo.findByTokenHash(refreshHash)
    if (!data) {
      return res.status(401).json({ error: 'invalid_token' })
    }
    await this.repo.deleteByTokenHash(refreshHash)
    const payload = { userId: data.userId, roles: data.roles, householdId: data.householdId }
    const accessToken = jwt.sign(payload, SECRET, { expiresIn: '15m' })
    const newRefreshToken = crypto.randomBytes(40).toString('hex')
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
    await this.repo.saveRefreshToken({ userId: data.userId, roles: data.roles, householdId: data.householdId, tokenHash: newHash })
    res.json({ accessToken, refreshToken: newRefreshToken })
  }
}
