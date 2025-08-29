import { Request, Response } from 'express'
import crypto from 'crypto'
import { AuthRepository } from '../repositories/auth'
import { UsersRepository } from '../repositories/users'
import { signToken } from '../services/jwt'
import { error } from '../lib/error'

const ALLOWED_ROLES = ['admin', 'user']
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60_000
const attempts = new Map<string, { count: number; expires: number }>()

function rateKey(identifier: string, ip: string) {
  return `${identifier}:${ip}`
}

function isRateLimited(key: string) {
  const info = attempts.get(key)
  if (!info) return false
  if (info.expires < Date.now()) {
    attempts.delete(key)
    return false
  }
  return info.count >= MAX_ATTEMPTS
}

function recordFailure(key: string) {
  const now = Date.now()
  const info = attempts.get(key)
  if (!info || info.expires < now) {
    attempts.set(key, { count: 1, expires: now + WINDOW_MS })
  } else {
    info.count++
  }
}

function clearAttempts(key: string) {
  attempts.delete(key)
}

export class AuthController {
  private repo: AuthRepository
  private users: UsersRepository

  constructor(repo: AuthRepository, users: UsersRepository) {
    this.repo = repo
    this.users = users
  }

  async login(req: Request, res: Response) {
    const { username, email, password } = req.body || {}
    const identifier = username || email
    if (!identifier || typeof password !== 'string') {
      return res
        .status(400)
        .json(error('invalid_credentials', 'Invalid credentials'))
    }

    const key = rateKey(identifier, req.ip)
    if (isRateLimited(key)) {
      return res
        .status(429)
        .json(error('too_many_attempts', 'Too many login attempts'))
    }

    const user = await this.users.verifyCredentials(identifier, password)
    if (!user) {
      recordFailure(key)
      return res
        .status(401)
        .json(error('invalid_credentials', 'Invalid credentials'))
    }

    clearAttempts(key)

    const roles = user.roles.filter((r) => ALLOWED_ROLES.includes(r))
    const payload = { userId: user.id, roles, householdId: user.householdId }
    const accessToken = signToken(payload, '15m')
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')
    await this.repo.saveRefreshToken({
      userId: user.id,
      roles,
      householdId: user.householdId,
      tokenHash: refreshHash,
    })
    res.json({ accessToken, refreshToken })
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body || {}
    if (!refreshToken) {
      return res
        .status(400)
        .json(error('missing_token', 'Refresh token required'))
    }
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')
    const data = await this.repo.findByTokenHash(refreshHash)
    if (!data) {
      return res.status(401).json(error('invalid_token', 'Invalid token'))
    }
    await this.repo.deleteByTokenHash(refreshHash)
    const payload = {
      userId: data.userId,
      roles: data.roles.filter((r) => ALLOWED_ROLES.includes(r)),
      householdId: data.householdId,
    }
    const accessToken = signToken(payload, '15m')
    const newRefreshToken = crypto.randomBytes(40).toString('hex')
    const newHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex')
    await this.repo.saveRefreshToken({
      userId: data.userId,
      roles: payload.roles,
      householdId: data.householdId,
      tokenHash: newHash,
    })
    res.json({ accessToken, refreshToken: newRefreshToken })
  }
}
