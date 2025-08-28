import { Router } from 'express';
import { VibeController } from '../controllers/vibe';
import { asyncHandler } from '../lib/asyncHandler';

export function createVibeRouter(controller: VibeController) {
  const router = Router();

  router.post('/vibe/dice', asyncHandler(controller.roll));

  return router;
}
