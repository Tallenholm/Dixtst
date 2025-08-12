import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module('pino', () => () => ({ info() {}, warn() {}, error() {}, debug() {} }));
mock.module('node-hue-api', { v3: { api: {}, discovery: {}, lightStates: {} } });

const InMemoryStorage = (await import('../storage.ts')).default;
const { CircadianEngine } = await import('../services/circadian-engine.ts');

test('circadian engine computes different states by time', () => {
  const engine = new CircadianEngine(new InMemoryStorage());
  const morning = (engine as any).computeTargetState(new Date('2020-01-01T08:00:00'));
  const night = (engine as any).computeTargetState(new Date('2020-01-01T23:00:00'));
  assert.notEqual(morning.colorTemp, night.colorTemp);
});
