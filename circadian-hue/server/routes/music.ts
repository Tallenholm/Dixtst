import { Router } from 'express';
import type { MusicMode } from '../services/music-mode';
import { asyncHandler } from '../lib/asyncHandler';

export function createMusicRouter(music: MusicMode) {
  const router = Router();

  router.post('/rooms/:roomId/music/start', asyncHandler(async (req, res) => {
    const { roomId } = req.params as any;
    const sens = Number(req.body?.sensitivity ?? 1.0);
    const s = music.start(roomId, sens);
    res.json({ ok: true, state: s });
  }));

  router.post('/rooms/:roomId/music/stop', asyncHandler(async (req, res) => {
    const { roomId } = req.params as any;
    const s = music.stop(roomId);
    res.json({ ok: true, state: s });
  }));

  router.post('/music/telemetry', asyncHandler(async (req, res) => {
    const { roomId, energy, tempo } = req.body || {};
    if (typeof energy !== 'number' || !roomId) {
      res.status(400).json({ error: 'roomId and numeric energy required' });
      return;
    }
    await music.telemetry(String(roomId), Number(energy), typeof tempo === 'number' ? tempo : undefined);
    res.json({ ok: true });
  }));

  return router;
}
