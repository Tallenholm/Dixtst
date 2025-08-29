import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq, or } from 'drizzle-orm'
import { users } from '@shared/schema'
import bcrypt from 'bcrypt'

export interface UserRecord {
  id: string
  username: string
  email: string
  passwordHash: string
  roles: string[]
  householdId?: string
}

export class UsersRepository {
  private db: NodePgDatabase

  constructor(db: NodePgDatabase) {
    this.db = db
  }

  private async findByIdentifier(identifier: string): Promise<UserRecord | undefined> {
    const row = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        passwordHash: users.passwordHash,
        roles: users.roles,
        householdId: users.householdId,
      })
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .limit(1)
      .then(r => r[0])
    if (!row) return undefined
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      roles: row.roles ?? [],
      householdId: row.householdId ?? undefined,
    }
  }

  async verifyCredentials(identifier: string, password: string): Promise<UserRecord | null> {
    const user = await this.findByIdentifier(identifier)
    if (!user) return null
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return null
    return user
  }
}
