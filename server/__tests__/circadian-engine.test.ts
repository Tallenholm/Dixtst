import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Bridge } from '@shared/schema';
import { CircadianEngine } from '../services/circadian-engine';
import type { IStorage } from '../storage';

test('engine ticks only after bridges are loaded', async () => {
  let resolveBridges: (bridges: Bridge[]) => void;
  const bridgesPromise = new Promise<Bridge[]>(res => { resolveBridges = res; });

  const storage: IStorage = {
    getAllBridges: () => bridgesPromise,
    getBridgeById: async () => undefined,
    insertBridge: async () => { throw new Error('not implemented'); },
    updateBridge: async (b: Bridge) => b,
    getLightById: async () => undefined,
    upsertLight: async (l: any) => l
  } as unknown as IStorage;

  const engine = new CircadianEngine(storage, { updateIntervalMs: 10_000 });

  let tickCount = 0;
  (engine as any).tick = async () => { tickCount++; };

  const startPromise = engine.start();

  // Ensure tick hasn't run before bridges resolve
  await new Promise(res => setTimeout(res, 50));
  assert.equal(tickCount, 0);

  resolveBridges!([{ id: '1', ip: '0.0.0.0', name: 'b', isConnected: true, username: 'u' }]);

  await startPromise;
  assert.equal(tickCount, 1);
  engine.stop();
});
