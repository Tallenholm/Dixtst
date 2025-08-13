import { Router } from 'express';
import { z } from 'zod';
import type { IStorage } from '../storage';
import { listOverrides, setRoomOverride, clearRoomOverride } from '../lib/overrides';
import { asyncHandler } from '../lib/asyncHandler';

export function createOverridesRouter(storage: IStorage) {
  const router = Router();

  router.get('/', asyncHandler(async (_req, res) => {
    const overrides = await listOverrides(storage);
    res.json({ overrides });
  }));

  const bodySchema = z.object({
    on: z.boolean().optional(),
    bri: z.number().optional(),
    ct: z.number().optional(),
    dnd: z.boolean().optional(),
    until: z.string().optional(),
    sceneId: z.string().optional(),
  });

  router.post('/rooms/:roomId', asyncHandler(async (req, res) => {
    const data = bodySchema.parse(req.body || {});
    await setRoomOverride(storage, String(req.params.roomId), data);
    res.json({ ok: true });
  }));

  router.delete('/rooms/:roomId', asyncHandler(async (req, res) => {
    await clearRoomOverride(storage, String(req.params.roomId));
    res.json({ ok: true });
  }));

  return router;
}
