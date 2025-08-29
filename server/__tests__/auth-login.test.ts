import { test } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import { AuthController } from '../../circadian-hue/server/controllers/auth.ts'
import { UsersRepository, UserRecord } from '../../circadian-hue/server/repositories/users.ts'
import { AuthRepository } from '../../circadian-hue/server/repositories/auth.ts'

process.env.JWT_SECRET = 'test-secret'

class StubAuthRepo implements Partial<AuthRepository> {
  async saveRefreshToken() {}
  async findByTokenHash() { return undefined }
  async deleteByTokenHash() {}
}

class StubUsersRepo implements Partial<UsersRepository> {
  private user: UserRecord
  constructor(user: UserRecord) { this.user = user }
  async verifyCredentials(identifier: string, password: string) {
    if (identifier !== this.user.username) return null
    const ok = await bcrypt.compare(password, this.user.passwordHash)
    return ok ? this.user : null
  }
}

test('failed logins are rate limited', async () => {
  const passwordHash = await bcrypt.hash('secret', 10)
  const user: UserRecord = { id: '1', username: 'alice', email: 'a@example.com', passwordHash, roles: ['user'] }
  const controller = new AuthController(new StubAuthRepo() as any, new StubUsersRepo(user) as any)

  const req = { body: { username: 'alice', password: 'wrong' }, ip: '127.0.0.1' } as any
  let status = 0
  const res = { status: (s: number) => { status = s; return res }, json: (_: any) => res }

  for (let i = 0; i < 5; i++) {
    await controller.login(req, res as any)
  }
  assert.equal(status, 401)

  await controller.login(req, res as any)
  assert.equal(status, 429)
})
