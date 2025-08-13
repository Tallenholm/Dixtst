import { v3 } from './hue-api.ts';
import type { Bridge, InsertBridge } from '@shared/schema';
import type { IStorage } from '../../storage.ts';
import logger from '../../logger.ts';

/**
 * Discover Hue Bridges via cloud (N-UPnP) and local (UPnP/SSDP).
 */
export async function discoverBridges(storage: IStorage): Promise<Bridge[]> {
  logger.info('Starting Hue Bridge discovery');
  let candidates: Record<string, string> = {};

  try {
    const cloud = await v3.discovery.nupnpSearch();
    logger.info('N-UPnP results', { count: cloud.length });
    cloud.forEach(b => { candidates[b.id] = b.internalipaddress; });
  } catch (err) {
    logger.warn('N-UPnP discovery failed', err);
  }

  try {
    const local = await v3.discovery.upnpSearch();
    logger.info('UPnP results', { count: local.length });
    local.forEach(b => { candidates[b.id] = b.internalipaddress; });
  } catch (err) {
    logger.warn('UPnP discovery failed', err);
  }

  const bridges: Bridge[] = [];
  for (const [id, ip] of Object.entries(candidates)) {
    let existing = await storage.getBridgeById(id);
    if (existing) {
      existing.ip = ip;
      existing.isConnected = true;
      existing.lastSeen = new Date();
      await storage.updateBridge(existing);
      bridges.push(existing);
    } else {
      const newBridge = await storage.insertBridge({
        id,
        ip,
        username: '',
        isConnected: false
      } as InsertBridge);
      bridges.push(newBridge);
    }
  }

  if (bridges.length === 0) {
    logger.warn('No Hue Bridges found on network');
  }

  return bridges;
}

/** Convenience wrapper used by older routes – returns a list of IPs only. */
export async function discover(storage: IStorage): Promise<string[]> {
  const bridges = await discoverBridges(storage);
  return bridges.map(b => b.ip);
}
