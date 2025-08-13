import { v3 } from './hue-api.ts';
import type { Bridge, InsertBridge } from '@shared/schema';
import type { IStorage } from '../../storage.ts';
import logger from '../../logger.ts';
import { isHueApiError, logError } from './errors.ts';

/**
 * Pair with a Hue Bridge by pressing its link button.
 * Throws if button not pressed.
 */
export async function pairBridge(storage: IStorage, bridge: Bridge): Promise<boolean> {
  logger.info('Attempting to pair with bridge', { bridgeId: bridge.id, ip: bridge.ip });
  try {
    const unauth = await v3.api.createLocal(bridge.ip).connect();
    const user = await unauth.users.createUser('circadian-hue#server');
    logger.info('Paired successfully', { username: user.username });
    bridge.username = user.username;
    bridge.isConnected = true;
    bridge.lastSeen = new Date();
    await storage.updateBridge(bridge);
    return true;
  } catch (err) {
    if (isHueApiError(err) && err.getHueErrorType() === 101) {
      logger.warn('Link button not pressed, pairing aborted');
      throw new Error('Please press the Hue Bridge link button and retry pairing.');
    }
    logError('Hue API error during pairing', err);
    return false;
  }
}

/** Pair with a bridge using the traditional link button flow. */
export async function pairWithLinkButton(
  storage: IStorage,
  ip: string,
  appName = 'circadian-hue',
  deviceName = 'server'
): Promise<{ ip: string; username: string }> {
  const unauth = await v3.api.createLocal(ip).connect();
  try {
    const user = await unauth.users.createUser(appName, deviceName);
    await storage.insertBridge({ id: ip, ip, username: user.username, isConnected: true } as InsertBridge);
    return { ip, username: user.username };
  } catch (e: any) {
    if (isHueApiError(e) && e.getHueErrorType() === 101) {
      throw new Error('link_button_not_pressed');
    }
    throw e;
  }
}
