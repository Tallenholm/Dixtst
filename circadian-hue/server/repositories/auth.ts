import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { refreshTokens } from '@shared/schema'

export interface RefreshTokenRecord {
  userId: string
  roles: string[]
  householdId?: string
  tokenHash: string
}

export class AuthRepository {
  private db: NodePgDatabase

  constructor(db: NodePgDatabase) {
    this.db = db
  }

  async saveRefreshToken(record: RefreshTokenRecord) {
    await this.db.insert(refreshTokens).values({
      userId: record.userId,
      roles: record.roles,
      householdId: record.householdId ?? null,
      tokenHash: record.tokenHash,
    })
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.db
      .select({
        userId: refreshTokens.userId,
        roles: refreshTokens.roles,
        householdId: refreshTokens.householdId,
        tokenHash: refreshTokens.tokenHash,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)
      .then(r => r[0])
    if (!row) return undefined
    return {
      userId: row.userId,
      roles: row.roles ?? [],
      householdId: row.householdId ?? undefined,
      tokenHash: row.tokenHash,
    }
  }

  async deleteByTokenHash(tokenHash: string) {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash))
  }
}
