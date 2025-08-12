import { Router } from 'express';
import { z } from 'zod';
import type { IStorage } from '../storage';
import { listOverrides, setRoomOverride, clearRoomOverride } from '../lib/overrides';

export function createOverridesRouter(storage: IStorage) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const overrides = await listOverrides(storage);
    res.json({ overrides });
  });

  const bodySchema = z.object({
    on: z.boolean().optional(),
    bri: z.number().optional(),
    ct: z.number().optional(),
    dnd: z.boolean().optional(),
    until: z.string().optional(),
    sceneId: z.string().optional(),
  });

  router.post('/rooms/:roomId', async (req, res) => {
    try {
      const data = bodySchema.parse(req.body || {});
      await setRoomOverride(storage, String(req.params.roomId), data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.delete('/rooms/:roomId', async (req, res) => {
    try {
      await clearRoomOverride(storage, String(req.params.roomId));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
