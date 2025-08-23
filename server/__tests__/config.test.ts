import { test } from 'node:test';
import assert from 'node:assert/strict';

const CONFIG_PATH = '../config/index.ts';

async function importConfig() {
  // Unique query to bypass import cache
  return import(`${CONFIG_PATH}?t=${Date.now()}-${Math.random()}`);
}

test('throws when DATABASE_URL is not set', async () => {
  const original = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  await assert.rejects(() => importConfig());
  if (original !== undefined) process.env.DATABASE_URL = original; else delete process.env.DATABASE_URL;
});

test('throws when DATABASE_URL is empty', async () => {
  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = '';
  await assert.rejects(() => importConfig());
  if (original !== undefined) process.env.DATABASE_URL = original; else delete process.env.DATABASE_URL;
});

test('uses provided DATABASE_URL when set', async () => {
  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgres://remote/db';
  const mod = await importConfig();
  assert.equal(mod.DATABASE_URL, 'postgres://remote/db');
  if (original !== undefined) process.env.DATABASE_URL = original; else delete process.env.DATABASE_URL;
});
