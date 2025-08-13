import { test } from 'node:test';
import assert from 'node:assert/strict';
import { v3 } from '../services/hue-bridge/hue-api.ts';

v3.api = {} as any;
v3.discovery = {} as any;
v3.lightStates = {} as any;

const InMemoryStorage = (await import('../storage.ts')).default;
const { CircadianEngine } = await import('../services/circadian-engine.ts');

test('circadian engine computes different states by time', () => {
  const engine = new CircadianEngine(new InMemoryStorage());
  const morning = (engine as any).computeTargetState(new Date('2020-01-01T08:00:00'));
  const night = (engine as any).computeTargetState(new Date('2020-01-01T23:00:00'));
  assert.notEqual(morning.colorTemp, night.colorTemp);
});
