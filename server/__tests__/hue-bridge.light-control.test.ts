import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { v3 } from '../services/hue-bridge/hue-api.ts';

import InMemoryStorage from '../storage.ts';
import { setLightState } from '../services/hue-bridge/light-control.ts';

const calls: any[] = [];

v3.api.createLocal = () => ({
  connect: async () => ({
    lights: {
      setLightState: mock.fn(async (_id, state) => { calls.push(state); })
    }
  })
});

class LightState {
  data: any = {};
  on() { this.data.on = true; return this; }
  off() { this.data.on = false; return this; }
  brightness(v: number) { this.data.bri = v; return this; }
  ct(v: number) { this.data.ct = v; return this; }
}

v3.lightStates.LightState = LightState as any;
v3.lightStates.GroupLightState = class {} as any;

test('setLightState clamps brightness', async () => {
  const storage = new InMemoryStorage();
  await storage.insertBridge({ id: 'b1', ip: '1.1.1.1', username: 'u', isConnected: true } as any);
  await setLightState(storage, '1', { bri: 300 });
  assert.equal(calls[0].data.bri, 254);
});
