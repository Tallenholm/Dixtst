import { promises as fs } from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { Bridge, Light } from '@shared/schema';
import type { InsertBridge, IStorage } from './storage';
import { normalizeBridge } from './storage';

interface Data {
  bridges: Bridge[];
  lights: Light[];
}

export class PersistentStorage implements IStorage {
  private db: Low<Data>;

  private constructor(db: Low<Data>) {
    this.db = db;
  }

  static async create(filePath = 'bridge-db.json'): Promise<PersistentStorage> {
    const adapter = new JSONFile<Data>(filePath);
    const defaultData: Data = { bridges: [], lights: [] };
    const db = new Low<Data>(adapter, defaultData);
    await db.read();
    db.data ||= defaultData;
    return new PersistentStorage(db);
  }

  private async write() {
    await this.db.write();
  }

  async getAllBridges(): Promise<Bridge[]> {
    return this.db.data!.bridges;
  }

  async getBridgeById(id: string): Promise<Bridge | undefined> {
    return this.db.data!.bridges.find(b => b.id === id);
  }

  async insertBridge(bridge: InsertBridge): Promise<Bridge> {
    const record = normalizeBridge(bridge);
    this.db.data!.bridges.push(record);
    await this.write();
    return record;
  }

  async updateBridge(bridge: Bridge): Promise<Bridge> {
    const idx = this.db.data!.bridges.findIndex(b => b.id === bridge.id);
    if (idx >= 0) {
      this.db.data!.bridges[idx] = bridge;
    } else {
      this.db.data!.bridges.push(bridge);
    }
    await this.write();
    return bridge;
  }

  async getLightById(id: string): Promise<Light | undefined> {
    return this.db.data!.lights.find(l => l.id === id);
  }

  async upsertLight(light: Light): Promise<Light> {
    const idx = this.db.data!.lights.findIndex(l => l.id === light.id);
    if (idx >= 0) {
      this.db.data!.lights[idx] = light;
    } else {
      this.db.data!.lights.push(light);
    }
    await this.write();
    return light;
  }

  /** Export all stored data to the given file path. */
  async exportToFile(filePath: string): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(this.db.data), 'utf-8');
  }

  /** Import bridge configuration data from a file. */
  async importFromFile(filePath: string): Promise<void> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as Data;
    this.db.data = data;
    await this.write();
  }
}

export default PersistentStorage;
