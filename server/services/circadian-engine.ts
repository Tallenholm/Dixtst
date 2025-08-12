import { v3 } from 'node-hue-api';
import logger from '../logger';
import type { Bridge } from '@shared/schema';

export class CircadianEngine {
  // ... constructor and fields ...

  private async updateLightsForBridge(bridge: Bridge, target: { brightness: number; colorTemp: number; transitionTime: number; }): Promise<void> {
    logger.debug('Updating lights via group command', { bridgeId: bridge.id, target });
    try {
      const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
      // Use group 0 for all lights in one call
      await api.groups.setGroupState(0, {
        on: true,
        bri: Math.round(target.brightness),
        ct: Math.round(target.colorTemp),
        transitiontime: target.transitionTime
      });
      logger.info('Group update successful', { bridgeId: bridge.id });
    } catch (err) {
      logger.error('Failed to update group lights', err);
    }
  }

  // Schedule dynamic updates instead of fixed interval if desired...
}
