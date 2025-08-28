import { Router } from 'express';
import { SleepController } from '../controllers/sleep';
import { asyncHandler } from '../lib/asyncHandler';

export function createSleepRouter(controller: SleepController) {
  const router = Router();

  router.post('/sleep/nightlight', asyncHandler(controller.nightlight));
  router.post('/sleep/winddown', asyncHandler(controller.winddown));
  router.post('/alarm/sunrise', asyncHandler(controller.sunrise));

  return router;
}
