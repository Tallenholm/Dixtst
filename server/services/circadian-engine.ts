import { v3 } from './hue-bridge/hue-api.ts';
import logger from '../logger';
import type { Bridge } from '@shared/schema';

/**
 * Configuration options for the circadian engine. The engine is intentionally
 * small and opinionated – it ticks on a fixed interval, computes a target light
 * state for the current time of day and applies that state to all known Hue
 * bridges. More advanced behaviour (sun position calculations, custom schedules
 * etc.) can be layered on top of this foundation.
 */
export interface EngineConfig {
  /** Interval between updates in milliseconds. Defaults to one minute. */
  updateIntervalMs?: number;
  /** Transition time used when issuing commands to the bridge (in deciseconds). */
  transitionTime?: number;
}

/**
 * CircadianEngine coordinates periodic light updates across multiple bridges.
 * It keeps track of the last state it sent to avoid redundant network traffic
 * and exposes a small API for starting/stopping the scheduler and registering
 * bridges at runtime.
 */
export class CircadianEngine {
  private storage: any;
  private config: Required<EngineConfig>;
  private bridges: Bridge[] = [];
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastState?: { brightness: number; colorTemp: number };

  constructor(storage: any, config: EngineConfig = {}) {
    // The concrete storage implementation isn't important for this kata; in the
    // real project it would conform to an `IStorage` interface capable of
    // listing bridges and persisting settings.
    this.storage = storage;
    this.config = {
      updateIntervalMs: config.updateIntervalMs ?? 60_000, // default: 1 minute
      transitionTime: config.transitionTime ?? 4 // 4 deciseconds = 400ms
    };

    // If the provided storage exposes a `getAllBridges` method we eagerly load
    // them so the engine can start operating immediately. This is a best effort
    // and failure is ignored – tests may provide a very small mock that does not
    // implement this helper.
    if (this.storage?.getAllBridges) {
      this.storage.getAllBridges().then((bs: Bridge[]) => {
        this.bridges = bs;
      }).catch(() => {});
    }
  }

  /** Start the periodic update loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.tick();
    this.scheduleNext();
  }

  /** Stop the periodic update loop. */
  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
  }

  /** Register a bridge so future ticks include it. */
  registerBridge(bridge: Bridge): void {
    if (!this.bridges.find(b => b.id === bridge.id)) {
      this.bridges.push(bridge);
    }
  }

  /** Apply the current target state to all registered bridges. */
  private async tick(): Promise<void> {
    const target = this.computeTargetState(new Date());

    if (this.lastState &&
        this.lastState.brightness === target.brightness &&
        this.lastState.colorTemp === target.colorTemp) {
      return; // nothing changed – skip network calls
    }

    this.lastState = { brightness: target.brightness, colorTemp: target.colorTemp };

    for (const bridge of this.bridges) {
      try {
        await this.updateLightsForBridge(bridge, target);
      } catch (err) {
        logger.error('Failed to update bridge', { bridgeId: bridge.id, err });
      }
    }
  }

  /** Schedule the next tick if the engine is still running. */
  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.tick();
      this.scheduleNext();
    }, this.config.updateIntervalMs);
  }

  /**
   * Compute target brightness and color temperature based on the current time of
   * day. The values returned here are intentionally simple but provide an easy
   * hook for more sophisticated circadian calculations in the future.
   */
  private computeTargetState(date: Date): { brightness: number; colorTemp: number; transitionTime: number } {
    const hour = date.getHours() + date.getMinutes() / 60;
    let brightness: number;
    let colorTemp: number;

    if (hour >= 6 && hour < 18) {
      // Daytime – bright and relatively cool
      brightness = 254;
      colorTemp = 250; // ~4000K
    } else if (hour >= 18 && hour < 22) {
      // Evening – slightly dimmer and warmer
      brightness = 200;
      colorTemp = 350; // ~2850K
    } else {
      // Night time – dim and very warm
      brightness = 120;
      colorTemp = 450; // ~2220K
    }

    return {
      brightness,
      colorTemp,
      transitionTime: this.config.transitionTime
    };
  }

  /**
   * Issue a group command to a Hue bridge to update all its lights.  Errors are
   * logged but do not interrupt the overall update cycle.
   */
  private async updateLightsForBridge(
    bridge: Bridge,
    target: { brightness: number; colorTemp: number; transitionTime: number }
  ): Promise<void> {
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

