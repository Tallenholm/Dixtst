import { v3 } from 'node-hue-api';
import type { Bridge, InsertBridge, WSMessage } from '@shared/schema';
import type { IStorage } from '../storage';
import logger from '../logger';

function isHueApiError(err: unknown): err is Error & { getHueErrorType(): number } {
  return err instanceof Error && typeof (err as any).getHueErrorType === 'function';
}

export class HueBridgeService {
  private storage: IStorage;
  private broadcastCallback?: (message: WSMessage) => void;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  setBroadcastCallback(callback: (message: WSMessage) => void) {
    this.broadcastCallback = callback;
  }

  /**
   * Discover Hue Bridges via cloud (N-UPnP) and local (UPnP/SSDP).
   */
  async discoverBridges(): Promise<Bridge[]> {
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
      let existing = await this.storage.getBridgeById(id);
      if (existing) {
        existing.ip = ip;
        existing.isConnected = true;
        existing.lastSeen = new Date();
        await this.storage.updateBridge(existing);
        bridges.push(existing);
      } else {
        const newBridge = await this.storage.insertBridge({
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

  /**
   * Pair with a Hue Bridge by pressing its link button.
   * Throws if button not pressed.
   */
  async pairBridge(bridge: Bridge): Promise<boolean> {
    logger.info('Attempting to pair with bridge', { bridgeId: bridge.id, ip: bridge.ip });
    try {
      const unauth = await v3.api.createLocal(bridge.ip).connect();
      const user = await unauth.users.createUser('circadian-hue#server');
      logger.info('Paired successfully', { username: user.username });
      bridge.username = user.username;
      bridge.isConnected = true;
      bridge.lastSeen = new Date();
      await this.storage.updateBridge(bridge);
      return true;
    } catch (err: unknown) {
      if (isHueApiError(err)) {
        if (err.getHueErrorType() === 101) {
          logger.warn('Link button not pressed, pairing aborted');
          throw new Error('Please press the Hue Bridge link button and retry pairing.');
        }
        logger.error('Hue API error during pairing', {
          hueErrorType: err.getHueErrorType(),
          message: err.message,
        });
      } else if (err instanceof Error) {
        logger.error('Unexpected error during pairing', { message: err.message });
      } else {
        logger.error('Unexpected non-error during pairing', err);
      }
      return false;
    }
  }

  // ... other methods (fetchLights, updateLight, etc.) ...
}
