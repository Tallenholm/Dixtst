import { Pool } from 'pg'

export class PermissionsRepository {
  constructor(private readonly db: Pool) {}

  async canToggleRoom(userId: string, roomId: string): Promise<boolean> {
    const res = await this.db.query(
      'SELECT can_toggle FROM room_permissions WHERE user_id = $1 AND room_id = $2',
      [userId, roomId]
    )
    return res.rows[0]?.can_toggle ?? false
  }

  async canSchedule(userId: string): Promise<boolean> {
    const res = await this.db.query(
      'SELECT 1 FROM room_permissions WHERE user_id = $1 AND can_schedule = true LIMIT 1',
      [userId]
    )
    return res.rowCount > 0
  }
}
