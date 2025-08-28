import { randomUUID } from 'crypto';
import type { Bridge, Light } from '@shared/schema';

export interface InsertBridge {
  ip: string;
  username: string;
  householdId: string;
  id?: string;
  name?: string;
  apiVersion?: string;
  isConnected?: boolean;
  lastSeen?: Date;
}

/**
 * Simple in-memory storage used for tests and development. The real project
 * uses a database layer, but for our purposes we only need a handful of
 * operations to satisfy the HueBridgeService.
 */
export interface IStorage {
  getAllBridges(householdId?: string): Promise<Bridge[]>;
  getBridgeById(id: string): Promise<Bridge | undefined>;
  insertBridge(bridge: InsertBridge): Promise<Bridge>;
  updateBridge(bridge: Bridge): Promise<Bridge>;
  getLightById(id: string): Promise<Light | undefined>;
  upsertLight(light: Light): Promise<Light>;
}

export function normalizeBridge(bridge: InsertBridge): Bridge {
  return {
    id: bridge.id ?? randomUUID(),
    name: bridge.name ?? '',
    ip: bridge.ip,
    username: bridge.username,
    apiVersion: bridge.apiVersion,
    householdId: bridge.householdId,
    isConnected: bridge.isConnected ?? false,
    lastSeen: bridge.lastSeen,
  };
}

class InMemoryStorage implements IStorage {
  private bridges = new Map<string, Bridge>();
  private lights = new Map<string, Light>();

  async getAllBridges(householdId?: string): Promise<Bridge[]> {
    const all = Array.from(this.bridges.values());
    return householdId ? all.filter(b => b.householdId === householdId) : all;
  }

  async getBridgeById(id: string): Promise<Bridge | undefined> {
    return this.bridges.get(id);
  }

  async insertBridge(bridge: InsertBridge): Promise<Bridge> {
    const record = normalizeBridge(bridge);
    this.bridges.set(record.id, record);
    return record;
  }

  async updateBridge(bridge: Bridge): Promise<Bridge> {
    this.bridges.set(bridge.id, bridge);
    return bridge;
  }

  async getLightById(id: string): Promise<Light | undefined> {
    return this.lights.get(id);
  }

  async upsertLight(light: Light): Promise<Light> {
    this.lights.set(light.id, light);
    return light;
  }
}

export { InMemoryStorage };
export default InMemoryStorage;
export { PersistentStorage } from './persistent-storage';
