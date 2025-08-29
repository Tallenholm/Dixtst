import { Pool } from 'pg'
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
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  private async findByIdentifier(identifier: string): Promise<UserRecord | undefined> {
    const res = await this.db.query(
      'SELECT id, username, email, password_hash as "passwordHash", roles, household_id as "householdId" FROM users WHERE username = $1 OR email = $1 LIMIT 1',
      [identifier]
    )
    const row = res.rows[0]
    if (!row) return undefined
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      roles: JSON.parse(row.roles),
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
