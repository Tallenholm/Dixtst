import { Router } from 'express';
import { OverridesController } from '../controllers/overrides';
import { asyncHandler } from '../lib/asyncHandler';
import { requireRoomRole } from '../lib/roles';

export function createOverridesRouter(controller: OverridesController) {
  const router = Router();

  router.get('/', asyncHandler(controller.list));
  router.post('/rooms/:roomId', requireRoomRole('roomId'), asyncHandler(controller.set));
  router.delete('/rooms/:roomId', requireRoomRole('roomId'), asyncHandler(controller.clear));

  return router;
}
