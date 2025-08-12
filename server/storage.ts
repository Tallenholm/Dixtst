import { randomUUID } from 'crypto';
import type { Bridge, InsertBridge, Light } from '@shared/schema';

/**
 * Simple in-memory storage used for tests and development. The real project
 * uses a database layer, but for our purposes we only need a handful of
 * operations to satisfy the HueBridgeService.
 */
export interface IStorage {
  getAllBridges(): Promise<Bridge[]>;
  getBridgeById(id: string): Promise<Bridge | undefined>;
  insertBridge(bridge: InsertBridge): Promise<Bridge>;
  updateBridge(bridge: Bridge): Promise<Bridge>;
  getLightById(id: string): Promise<Light | undefined>;
  upsertLight(light: Light): Promise<Light>;
}

class InMemoryStorage implements IStorage {
  private bridges = new Map<string, Bridge>();
  private lights = new Map<string, Light>();

  async getAllBridges(): Promise<Bridge[]> {
    return Array.from(this.bridges.values());
  }

  async getBridgeById(id: string): Promise<Bridge | undefined> {
    return this.bridges.get(id);
  }

  async insertBridge(bridge: InsertBridge): Promise<Bridge> {
    const record: Bridge = {
      id: (bridge as any).id ?? randomUUID(),
      name: (bridge as any).name ?? '',
      ip: bridge.ip,
      username: bridge.username,
      apiVersion: (bridge as any).apiVersion,
      isConnected: (bridge as any).isConnected ?? false,
      lastSeen: (bridge as any).lastSeen,
    };
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
