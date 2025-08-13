import { Router } from 'express';
import { rollVibe } from '../lib/vibe';
import type { HueBridgeService } from '../services/hue-bridge';
import { asyncHandler } from '../lib/asyncHandler';

export function createVibeRouter(hueBridge: HueBridgeService) {
  const router = Router();

  router.post('/vibe/dice', asyncHandler(async (req, res) => {
    const { seed, warmth, intensity } = req.body || {};
    const v = rollVibe({ seed, warmth, intensity });
    await hueBridge.applyStateToAllLights({ on: true, bri: v.bri, ct: v.ct });
    res.json({ applied: v });
  }));

  return router;
}
