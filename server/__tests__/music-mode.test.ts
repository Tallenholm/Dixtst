import { test } from 'node:test';
import assert from 'node:assert/strict';

const { MusicMode } = await import('../../circadian-hue/server/services/music-mode.ts');

class StubHue {
  public calls: Array<{ id: string; state: any }> = [];
  async getRoomLightIds(_roomId: string) {
    return ['1', '2'];
  }
  async setLightState(id: string, state: any) {
    this.calls.push({ id, state });
  }
}

test('music mode only updates lights in the room', async () => {
  const hue = new StubHue();
  const storage: any = {};
  const mm = new MusicMode(storage, hue as any);
  mm.start('room1');
  await mm.telemetry('room1', 0.8);
  assert.equal(hue.calls.length, 2);
});
