import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { lights as lightsTable, systemSettings } from '@shared/schema'
import { db } from './services/db'

export interface Setting<T> { key: string; value: T; updatedAt: string }

export interface Light {
  id: string
  name: string
  isOn: boolean
  brightness: number
  colorTemp: number
  updatedAt: string
}

export interface IStorage {
  getAllLights(): Promise<Light[]>
  getAllSettings(): Promise<Setting<unknown>[]>
  getSetting<T>(key: string): Promise<Setting<T> | undefined>
  setSetting<T>(key: string, value: T): Promise<Setting<T>>
  deleteSetting(key: string): Promise<boolean>
}

class DbStorage implements IStorage {
  private db: NodePgDatabase

  constructor(db: NodePgDatabase) {
    this.db = db
  }

  async getAllLights(): Promise<Light[]> {
    const rows = await this.db
      .select({
        id: lightsTable.id,
        name: lightsTable.name,
        isOn: lightsTable.isOn,
        brightness: lightsTable.brightness,
        colorTemp: lightsTable.colorTemp,
      })
      .from(lightsTable)
    return rows.map(row => ({ ...row, updatedAt: new Date().toISOString() }))
  }

  async getAllSettings(): Promise<Setting<unknown>[]> {
    const rows = await this.db.select().from(systemSettings)
    return rows.map(row => ({ key: row.key, value: row.value, updatedAt: row.updatedAt.toISOString() }))
  }

  async getSetting<T>(key: string): Promise<Setting<T> | undefined> {
    const rows = await this.db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1)
    const row = rows[0]
    return row ? { key: row.key, value: row.value as T, updatedAt: row.updatedAt.toISOString() } : undefined
  }

  async setSetting<T>(key: string, value: T): Promise<Setting<T>> {
    const row = await this.db.transaction(async tx => {
      const existing = await tx
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .for('update')
      if (existing.length > 0) {
        const updated = await tx
          .update(systemSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(systemSettings.key, key))
          .returning()
        return updated[0]
      } else {
        const inserted = await tx
          .insert(systemSettings)
          .values({ key, value })
          .returning()
        return inserted[0]
      }
    })
    return { key: row.key, value: row.value as T, updatedAt: row.updatedAt.toISOString() }
  }

  async deleteSetting(key: string): Promise<boolean> {
    const res = await this.db.delete(systemSettings).where(eq(systemSettings.key, key))
    return res.rowCount > 0
  }
}

export const storage: IStorage = new DbStorage(db)
