import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { BridgeCredentials, LocationInfo, ScheduleEntry } from '@shared/types';

export interface SettingRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

export class Storage {
  private db: Database.Database;

  constructor(dbPath = process.env.HUE_DB_PATH ?? path.resolve(process.cwd(), 'data/circadian-hue.db')) {
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
    );
  }

  listSettings(): SettingRecord<unknown>[] {
    const rows = this.db
      .prepare('SELECT key, value, updated_at FROM settings')
      .all() as { key: string; value: string; updated_at: number }[];
    return rows.map((row) => ({
      key: row.key,
      value: JSON.parse(row.value),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  getSetting<T>(key: string): SettingRecord<T> | undefined {
    const row = this.db
      .prepare('SELECT key, value, updated_at FROM settings WHERE key = ? LIMIT 1')
      .get(key) as { key: string; value: string; updated_at: number } | undefined;
    if (!row) return undefined;
    try {
      const value = JSON.parse(row.value) as T;
      return {
        key: row.key,
        value,
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to parse stored value for key "${key}": ${String(error)}`);
    }
  }

  setSetting<T>(key: string, value: T): SettingRecord<T> {
    const now = Date.now();
    const payload = JSON.stringify(value);
    this.db
      .prepare(
        `INSERT INTO settings(key, value, updated_at) VALUES (@key, @value, @now)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run({ key, value: payload, now });
    return { key, value, updatedAt: new Date(now).toISOString() };
  }

  deleteSetting(key: string): void {
    this.db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  }

  getSchedules(): ScheduleEntry[] {
    return this.getSetting<ScheduleEntry[]>('schedules')?.value ?? [];
  }

  saveSchedules(entries: ScheduleEntry[]): void {
    this.setSetting('schedules', entries);
  }

  getLocation(): LocationInfo | undefined {
    return this.getSetting<LocationInfo>('location')?.value;
  }

  saveLocation(location: LocationInfo): void {
    this.setSetting('location', location);
  }

  getBridge(): BridgeCredentials | undefined {
    return this.getSetting<BridgeCredentials>('bridge')?.value;
  }

  saveBridge(credentials: BridgeCredentials): void {
    this.setSetting('bridge', credentials);
  }

  clearBridge(): void {
    this.deleteSetting('bridge');
  }

  getActiveEffect(): { id: string; startedAt: string } | undefined {
    return this.getSetting<{ id: string; startedAt: string }>('activeEffect')?.value;
  }

  saveActiveEffect(id: string | null): void {
    if (!id) {
      this.deleteSetting('activeEffect');
      return;
    }
    this.setSetting('activeEffect', { id, startedAt: new Date().toISOString() });
  }
}
