import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const nupnp = mock.fn(async () => [
  { id: '1', internalipaddress: '1.1.1.1' },
  { id: '2', internalipaddress: '2.2.2.2' },
]);
const upnp = mock.fn(async () => [
  { id: '2', internalipaddress: '2.2.2.2' },
  { id: '3', internalipaddress: '3.3.3.3' },
]);

mock.module('pino', () => () => ({ info() {}, warn() {}, error() {}, debug() {} }));
mock.module('node-hue-api', {
  v3: {
    discovery: { nupnpSearch: nupnp, upnpSearch: upnp },
    api: { createLocal: () => ({ connect: async () => ({}) }) },
    lightStates: { LightState: class {}, GroupLightState: class {} },
  },
});

import InMemoryStorage from '../storage.ts';
const { HueBridgeService } = await import('../services/hue-bridge.ts');

test('discover dedupes search results', async () => {
  const storage = new InMemoryStorage();
  const svc = new HueBridgeService(storage);
  const ips = await svc.discover();
  assert.deepEqual(ips.sort(), ['1.1.1.1', '2.2.2.2', '3.3.3.3']);
});
