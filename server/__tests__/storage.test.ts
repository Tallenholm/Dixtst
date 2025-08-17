import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { rm, mkdir } from 'fs/promises';

import { InMemoryStorage, PersistentStorage, type InsertBridge } from '../storage.ts';

async function withPersistent(run: (storage: PersistentStorage) => Promise<void>) {
  const dir = join(tmpdir(), randomUUID());
  await mkdir(dir, { recursive: true });
  const file = join(dir, 'db.json');
  const storage = await PersistentStorage.create(file);
  try {
    await run(storage);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const baseBridge: InsertBridge = {
  ip: '1.1.1.1',
  username: 'user',
};

test('insertBridge applies default fields', async () => {
  const mem = new InMemoryStorage();
  const memBridge = await mem.insertBridge(baseBridge);
  assert.equal(memBridge.name, '');
  assert.equal(memBridge.isConnected, false);
  assert.ok(memBridge.id);

  await withPersistent(async storage => {
    const fileBridge = await storage.insertBridge(baseBridge);
    assert.equal(fileBridge.name, '');
    assert.equal(fileBridge.isConnected, false);
    assert.ok(fileBridge.id);
  });
});

test('insertBridge preserves provided values', async () => {
  const input: InsertBridge = {
    id: 'abc',
    ip: '2.2.2.2',
    username: 'foo',
    name: 'Bridge',
    apiVersion: '1.0',
    isConnected: true,
    lastSeen: new Date('2024-01-01T00:00:00Z'),
  };
  const mem = new InMemoryStorage();
  const expected = await mem.insertBridge(input);

  await withPersistent(async storage => {
    const actual = await storage.insertBridge(input);
    assert.deepEqual(actual, expected);
  });
});
