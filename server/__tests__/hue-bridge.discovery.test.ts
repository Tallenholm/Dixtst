import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { v3 } from '../services/hue-bridge/hue-api.ts';

import InMemoryStorage from '../storage.ts';
import { discover } from '../services/hue-bridge/discovery.ts';

v3.discovery.nupnpSearch = mock.fn(async () => [
  { id: '1', internalipaddress: '1.1.1.1' },
  { id: '2', internalipaddress: '2.2.2.2' },
]);
v3.discovery.upnpSearch = mock.fn(async () => [
  { id: '2', internalipaddress: '2.2.2.2' },
  { id: '3', internalipaddress: '3.3.3.3' },
]);

test('discover dedupes search results', async () => {
  const storage = new InMemoryStorage();
  const ips = await discover(storage);
  assert.deepEqual(ips.sort(), ['1.1.1.1', '2.2.2.2', '3.3.3.3']);
});
