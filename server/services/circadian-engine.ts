import { v3 } from 'node-hue-api';
import SunCalc from 'suncalc';
import logger from '../logger';
import type { Bridge } from '@shared/schema';
import type { IStorage } from './storage';
import { HueBridgeService } from './hue-bridge';

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
  /** Latitude for sunrise/sunset calculations. */
  latitude?: number;
  /** Longitude for sunrise/sunset calculations. */
  longitude?: number;
}

/**
 * CircadianEngine coordinates periodic light updates across multiple bridges.
 * It keeps track of the last state it sent to avoid redundant network traffic
 * and exposes a small API for starting/stopping the scheduler and registering
 * bridges at runtime.
 */
export class CircadianEngine {
  private storage: IStorage;
  private config: Required<EngineConfig>;
  private bridges: Bridge[] = [];
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastState?: { brightness: number; colorTemp: number };

  constructor(storage: IStorage, config: EngineConfig = {}) {
    // The concrete storage implementation isn't important for this kata; in the
    // real project it conforms to an `IStorage` interface capable of
    // listing bridges and persisting settings.
    this.storage = storage;
    this.config = {
      updateIntervalMs: config.updateIntervalMs ?? 60_000, // default: 1 minute
      transitionTime: config.transitionTime ?? 4, // 4 deciseconds = 400ms
      latitude: config.latitude ?? 0,
      longitude: config.longitude ?? 0
    };
  }

  /** Start the periodic update loop. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      this.bridges = await this.storage.getAllBridges();
    } catch (err) {
      logger.error('Failed to load bridges from storage', err);
      try {
        const service = new HueBridgeService(this.storage);
        this.bridges = await service.discoverBridges();
      } catch (discoverErr) {
        logger.error('Bridge discovery failed', discoverErr);
        this.bridges = [];
      }
    }

    await this.tick();
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
    const { latitude, longitude } = this.config;
    const { altitude } = SunCalc.getPosition(date, latitude, longitude);
    const elevation = altitude * 180 / Math.PI; // convert to degrees

    // Map elevation to brightness and color temperature ranges.
    const minElevation = -6; // civil twilight end
    const maxElevation = 60; // clamp to typical max sun elevation
    const clamped = Math.min(Math.max(elevation, minElevation), maxElevation);

    const scale = (clamped - minElevation) / (maxElevation - minElevation);
    const brightness = 120 + scale * (254 - 120);
    const colorTemp = 450 - scale * (450 - 250);

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

