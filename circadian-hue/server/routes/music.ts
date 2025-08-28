import { Router } from 'express';
import { MusicController } from '../controllers/music';
import { asyncHandler } from '../lib/asyncHandler';

export function createMusicRouter(controller: MusicController) {
  const router = Router();

  router.post('/rooms/:roomId/music/start', asyncHandler(controller.start));
  router.post('/rooms/:roomId/music/stop', asyncHandler(controller.stop));
  router.post('/music/telemetry', asyncHandler(controller.telemetry));

  return router;
}
