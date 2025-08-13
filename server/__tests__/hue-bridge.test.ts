import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as hueApi from 'node-hue-api';

const nupnp = mock.fn(async () => [
  { id: '1', internalipaddress: '1.1.1.1' },
  { id: '2', internalipaddress: '2.2.2.2' },
]);
const upnp = mock.fn(async () => [
  { id: '2', internalipaddress: '2.2.2.2' },
  { id: '3', internalipaddress: '3.3.3.3' },
]);

const createUser = mock.fn(async () => ({ username: 'mock-user' }));

mock.method(hueApi.v3.discovery, 'nupnpSearch', nupnp);
mock.method(hueApi.v3.discovery, 'upnpSearch', upnp);
mock.method(hueApi.v3.api, 'createLocal', () => ({ connect: async () => ({ users: { createUser } }) }));

import InMemoryStorage from '../storage.ts';
const { HueBridgeService } = await import('../services/hue-bridge.ts');

test('discover dedupes search results', async () => {
  const storage = new InMemoryStorage();
  const svc = new HueBridgeService(storage);
  const ips = await svc.discover();
  assert.deepEqual(ips.sort(), ['1.1.1.1', '2.2.2.2', '3.3.3.3']);
});

test('pairBridge returns true on success', async () => {
  const storage = new InMemoryStorage();
  const bridge = await storage.insertBridge({ id: '1', ip: '1.1.1.1', username: '', isConnected: false } as any);
  const svc = new HueBridgeService(storage);
  createUser.mock.resetCalls();
  createUser.mock.mockImplementation(async () => ({ username: 'user123' }));
  const result = await svc.pairBridge(bridge);
  assert.equal(result, true);
  const updated = await storage.getBridgeById('1');
  assert.equal(updated?.username, 'user123');
});

test('pairBridge throws when link button not pressed', async () => {
  const storage = new InMemoryStorage();
  const bridge = await storage.insertBridge({ id: '1', ip: '1.1.1.1', username: '', isConnected: false } as any);
  const svc = new HueBridgeService(storage);
  const err = new Error('link button');
  (err as any).getHueErrorType = () => 101;
  createUser.mock.resetCalls();
  createUser.mock.mockImplementation(async () => { throw err; });
  await assert.rejects(() => svc.pairBridge(bridge), /Please press the Hue Bridge link button/);
});

test('pairBridge rethrows unexpected errors', async () => {
  const storage = new InMemoryStorage();
  const bridge = await storage.insertBridge({ id: '1', ip: '1.1.1.1', username: '', isConnected: false } as any);
  const svc = new HueBridgeService(storage);
  const err = new Error('boom');
  createUser.mock.resetCalls();
  createUser.mock.mockImplementation(async () => { throw err; });
  await assert.rejects(() => svc.pairBridge(bridge), err);
});
