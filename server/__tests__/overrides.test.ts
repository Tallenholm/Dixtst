import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listOverrides } from '../../circadian-hue/server/lib/overrides.ts';
import type { IStorage, Setting } from '../../circadian-hue/server/storage.ts';

class TestStorage implements IStorage {
  settings = new Map<string, Setting<any>>();
  deleteCalls: string[] = [];

  async getAllLights() { return []; }
  async getAllSettings() { return Array.from(this.settings.values()); }
  async getSetting<T>(key: string) { return this.settings.get(key) as Setting<T> | undefined; }
  async setSetting<T>(key: string, value: T) {
    const s: Setting<T> = { key, value, updatedAt: new Date() };
    this.settings.set(key, s);
    return s;
  }
  async deleteSetting(key: string) {
    this.deleteCalls.push(key);
    return this.settings.delete(key);
  }
}

test('listOverrides removes expired entries', async () => {
  const storage = new TestStorage();
  const now = Date.now();

  await storage.setSetting('override:room:1', { on: true });
  await storage.setSetting('override:room:2', { until: new Date(now + 1000).toISOString() });
  await storage.setSetting('override:room:3', { until: new Date(now - 1000).toISOString() });

  const active = await listOverrides(storage);

  assert.equal(active.length, 2);
  assert.ok(active.every(s => s.key !== 'override:room:3'));
  assert.deepEqual(storage.deleteCalls, ['override:room:3']);
  assert.ok(!storage.settings.has('override:room:3'));
});

