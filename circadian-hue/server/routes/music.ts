import { Router } from 'express';
import { MusicController } from '../controllers/music';
import { asyncHandler } from '../lib/asyncHandler';
import { requireRoomRole } from '../lib/roles';

export function createMusicRouter(controller: MusicController) {
  const router = Router();

  router.post('/rooms/:roomId/music/start', requireRoomRole('roomId'), asyncHandler(controller.start));
  router.post('/rooms/:roomId/music/stop', requireRoomRole('roomId'), asyncHandler(controller.stop));
  router.post('/music/telemetry', asyncHandler(controller.telemetry));

  return router;
}
