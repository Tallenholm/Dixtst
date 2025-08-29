import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signToken, verifyToken, revokeToken } from '../../circadian-hue/server/services/jwt.ts'

process.env.JWT_SECRET = 'test-secret'

test('expired token is rejected', async () => {
  const token = signToken({ userId: 'u1', roles: [] }, '1ms')
  await new Promise((r) => setTimeout(r, 10))
  assert.throws(() => verifyToken(token), /expired/i)
})

test('revoked token is rejected', () => {
  const token = signToken({ userId: 'u1', roles: [] })
  revokeToken(token)
  assert.throws(() => verifyToken(token), /revoked/i)
})
