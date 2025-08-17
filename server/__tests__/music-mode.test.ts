import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { MusicMode } from '../../circadian-hue/server/services/music-mode.ts';

test('music mode only updates lights in the room', async () => {
  const hue = {
    getRoomLightIds: mock.fn(async (roomId: string) => {
      if (roomId === 'a') return ['1', '2'];
      if (roomId === 'b') return ['3'];
      return [];
    }),
    setLightState: mock.fn(async () => {})
  };

  const music = new MusicMode({} as any, hue as any);
  music.start('a');
  music.start('b');

  await music.telemetry('a', 0.8);

  assert.equal(hue.getRoomLightIds.mock.calls.length, 1);
  assert.equal(hue.getRoomLightIds.mock.calls[0].arguments[0], 'a');

  const updatedIds = hue.setLightState.mock.calls.map(c => c.arguments[0]).sort();
  assert.deepEqual(updatedIds, ['1', '2']);
});
