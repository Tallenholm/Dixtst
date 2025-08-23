import type { Pool } from 'pg'
import { db } from './services/db'

export interface Setting<T> { key: string; value: T; updatedAt: Date }

export interface Light {
  id: string
  name: string
  isOn: boolean
  brightness: number
  colorTemp: number
  updatedAt: Date
}

export interface IStorage {
  getAllLights(): Promise<Light[]>
  getAllSettings(): Promise<Setting<unknown>[]>
  getSetting<T>(key: string): Promise<Setting<T> | undefined>
  setSetting<T>(key: string, value: T): Promise<Setting<T>>
  deleteSetting(key: string): Promise<boolean>
}

class DbStorage implements IStorage {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  async getAllLights(): Promise<Light[]> {
    const res = await this.db.query('SELECT id, name, is_on as "isOn", brightness, color_temp as "colorTemp" FROM lights')
    return res.rows.map((row: any) => ({ ...row, updatedAt: new Date() }))
  }

  async getAllSettings(): Promise<Setting<unknown>[]> {
    const res = await this.db.query('SELECT key, value, updated_at FROM system_settings')
    return res.rows.map((row: any) => ({ key: row.key, value: row.value, updatedAt: row.updated_at }))
  }

  async getSetting<T>(key: string): Promise<Setting<T> | undefined> {
    const res = await this.db.query('SELECT key, value, updated_at FROM system_settings WHERE key = $1', [key])
    const row = res.rows[0]
    return row ? { key: row.key, value: row.value, updatedAt: row.updated_at } : undefined
  }

  async setSetting<T>(key: string, value: T): Promise<Setting<T>> {
    const res = await this.db.query('INSERT INTO system_settings(key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW() RETURNING key, value, updated_at', [key, value])
    const row = res.rows[0]
    return { key: row.key, value: row.value, updatedAt: row.updated_at }
  }

  async deleteSetting(key: string): Promise<boolean> {
    const res = await this.db.query('DELETE FROM system_settings WHERE key = $1', [key])
    return res.rowCount > 0
  }
}

async function ensureIndexes(db: Pool) {
  try {
    await db.query('CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)')
    await db.query('CREATE INDEX IF NOT EXISTS idx_lights_name ON lights(name)')
  } catch (err) {
    console.error('Failed to ensure indexes', err)
  }
}

// fire and forget
ensureIndexes(db)

export const storage: IStorage = new DbStorage(db)
