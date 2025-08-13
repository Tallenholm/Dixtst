import { Router } from 'express';
import type { HueBridgeService } from '../services/hue-bridge';
import type { Scheduler } from '../services/scheduler';
import { asyncHandler } from '../lib/asyncHandler';

export function createSleepRouter(hueBridge: HueBridgeService, scheduler: Scheduler) {
  const router = Router();

  router.post('/sleep/nightlight', asyncHandler(async (_req, res) => {
    await hueBridge.applyStateToAllLights({ on: true, bri: 30, ct: 430 });
    res.json({ ok: true });
  }));

  router.post('/sleep/winddown', asyncHandler(async (req, res) => {
    const minutes = Math.max(5, Math.min(120, Number(req.body?.minutes ?? 30)));
    const steps = minutes;
    let i = 0;
    const startBri = 150, endBri = 30;
    const startCt = 350, endCt = 430;
    const id = 'winddown';
    let errors = 0;
    scheduler.scheduleInterval(id, async () => {
      i++;
      const t = Math.min(1, i / steps);
      const bri = Math.round(startBri * (1 - t) + endBri * t);
      const ct = Math.round(startCt * (1 - t) + endCt * t);
      try {
        await hueBridge.applyStateToAllLights({ on: true, bri, ct });
        errors = 0;
      } catch (err) {
        errors++;
        console.error('winddown interval failed', err);
        if (errors >= 5) scheduler.clear(id);
      }
      if (i >= steps) scheduler.clear(id);
    }, 60 * 1000);
    res.json({ ok: true, minutes });
  }));

  router.post('/alarm/sunrise', asyncHandler(async (req, res) => {
    const minutes = Math.max(5, Math.min(90, Number(req.body?.minutes ?? 30)));
    let i = 0;
    const steps = minutes;
    const startBri = 10, endBri = 220;
    const startCt = 430, endCt = 250;
    const id = 'sunrise';
    scheduler.scheduleInterval(id, async () => {
      i++;
      const t = Math.min(1, i / steps);
      const bri = Math.round(startBri * (1 - t) + endBri * t);
      const ct = Math.round(startCt * (1 - t) + endCt * t);
      try { await hueBridge.applyStateToAllLights({ on: true, bri, ct }); } catch {}
      if (i >= steps) scheduler.clear(id);
    }, 60 * 1000);
    res.json({ ok: true, minutes });
  }));

  return router;
}
