import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { and, eq } from 'drizzle-orm'
import { roomPermissions } from '@shared/schema'

export class PermissionsRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async canToggleRoom(userId: string, roomId: string): Promise<boolean> {
    const rows = await this.db
      .select({ canToggle: roomPermissions.canToggle })
      .from(roomPermissions)
      .where(and(eq(roomPermissions.userId, userId), eq(roomPermissions.roomId, roomId)))
    return rows[0]?.canToggle ?? false
  }

  async canSchedule(userId: string): Promise<boolean> {
    const rows = await this.db
      .select({ userId: roomPermissions.userId })
      .from(roomPermissions)
      .where(and(eq(roomPermissions.userId, userId), eq(roomPermissions.canSchedule, true)))
      .limit(1)
    return rows.length > 0
  }
}
