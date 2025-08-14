import { test } from 'node:test';
import assert from 'node:assert/strict';

const { CircadianEngine } = await import('../services/circadian-engine.ts');

// minimal storage stub
const storage: any = { getAllBridges: async () => [] };

test('computeTargetState handles polar day and polar night', () => {
  const engine = new CircadianEngine(storage, {
    latitude: 78.2232,
    longitude: 15.6469
  });

  const polarDay = new Date(Date.UTC(2024, 5, 21, 12, 0));
  const polarNight = new Date(Date.UTC(2024, 11, 21, 12, 0));

  const dayState = (engine as any).computeTargetState(polarDay);
  const nightState = (engine as any).computeTargetState(polarNight);

  assert.ok(dayState.brightness > nightState.brightness);
  assert.ok(dayState.colorTemp < nightState.colorTemp);
});

test('computeTargetState changes smoothly across DST transition', () => {
  const engine = new CircadianEngine(storage, {
    latitude: 52.52,
    longitude: 13.4050
  });

  // Europe/Berlin DST starts 2024-03-31 at 01:00 UTC -> 02:00 local
  const beforeDST = new Date(Date.UTC(2024, 2, 31, 0, 30));
  const afterDST = new Date(Date.UTC(2024, 2, 31, 1, 30));

  const beforeState = (engine as any).computeTargetState(beforeDST);
  const afterState = (engine as any).computeTargetState(afterDST);

  // Across the DST jump the computed state should not abruptly change
  assert.ok(Math.abs(afterState.brightness - beforeState.brightness) < 1);
  assert.ok(Math.abs(afterState.colorTemp - beforeState.colorTemp) < 1);
});

