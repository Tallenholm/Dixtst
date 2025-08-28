import { Pool } from 'pg'

export interface RefreshTokenRecord {
  userId: string
  roles: string[]
  householdId?: string
  tokenHash: string
}

export class AuthRepository {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  async saveRefreshToken(record: RefreshTokenRecord) {
    await this.db.query(
      'INSERT INTO refresh_tokens(user_id, roles, household_id, token_hash, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [record.userId, JSON.stringify(record.roles), record.householdId ?? null, record.tokenHash]
    )
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | undefined> {
    const res = await this.db.query(
      'SELECT user_id as "userId", roles, household_id as "householdId", token_hash as "tokenHash" FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    )
    const row = res.rows[0]
    if (!row) return undefined
    return { userId: row.userId, roles: JSON.parse(row.roles), householdId: row.householdId ?? undefined, tokenHash: row.tokenHash }
  }

  async deleteByTokenHash(tokenHash: string) {
    await this.db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash])
  }
}
