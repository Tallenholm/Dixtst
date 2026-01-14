import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import {
  PRESET_SCENES,
  LIGHT_EFFECTS,
  DEFAULT_LOCATION_DETECT_URL,
} from '@shared/constants';
import type { CustomScene, ScheduleEntry } from '@shared/types';
import { HueBridgeService } from '../services/hue';
import { CircadianScheduler } from '../services/circadian';
import { StatusService } from '../services/status';
import { Storage } from '../storage';

const LOCATION_ENDPOINT = process.env.LOCATION_ENDPOINT ?? DEFAULT_LOCATION_DETECT_URL;
const MAX_CUSTOM_SCENES = 32;

type Deps = {
  hue: HueBridgeService;
  scheduler: CircadianScheduler;
  status: StatusService;
  storage: Storage;
};

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

function isScheduleEntry(value: any): value is ScheduleEntry {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
  if (typeof value.wakeTime !== 'string' || typeof value.sleepTime !== 'string') return false;
  if (typeof value.enabled !== 'boolean') return false;
  if (value.days && (!Array.isArray(value.days) || value.days.some((d: any) => typeof d !== 'number'))) return false;
  return true;
}

type CustomSceneInput = Omit<CustomScene, 'id' | 'createdAt'>;

function parseCustomScenePayload(body: any): CustomSceneInput | null {
  if (!body || typeof body !== 'object') return null;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return null;
  const brightness = Number(body.brightness);
  if (!Number.isFinite(brightness)) return null;
  const normalizedBrightness = Math.round(Math.min(Math.max(brightness, 1), 254));

  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  const hasColorTemp = body.colorTemp !== undefined && body.colorTemp !== null;
  const colorTempValue = hasColorTemp ? Number(body.colorTemp) : undefined;
  const normalizedColorTemp =
    hasColorTemp && Number.isFinite(colorTempValue)
      ? Math.round(Math.min(Math.max(colorTempValue as number, 153), 500))
      : undefined;

  const hasHueOrSat = body.hue !== undefined || body.sat !== undefined;
  const hueValue = body.hue !== undefined ? Number(body.hue) : undefined;
  const satValue = body.sat !== undefined ? Number(body.sat) : undefined;
  const validHue = hueValue !== undefined && Number.isFinite(hueValue) && hueValue >= 0 && hueValue <= 65535;
  const validSat = satValue !== undefined && Number.isFinite(satValue) && satValue >= 0 && satValue <= 254;

  if (hasHueOrSat && (!validHue || !validSat)) return null;

  if (!normalizedColorTemp && !validHue) return null;

  return {
    name: name.slice(0, 60),
    description: description ? description.slice(0, 160) : undefined,
    brightness: normalizedBrightness,
    colorTemp: normalizedColorTemp,
    hue: validHue ? Math.round(hueValue as number) : undefined,
    sat: validSat ? Math.round(satValue as number) : undefined,
  };
}

export function createApiRouter({ hue, scheduler, status, storage }: Deps) {
  const router = Router();

  router.get(
    '/status',
    asyncHandler(async (_req, res) => {
      const payload = await status.getStatus();
      res.json(payload);
    }),
  );

  router.get(
    '/lights',
    asyncHandler(async (_req, res) => {
      const lights = await status.getLights(true);
      res.json({ lights });
    }),
  );

  router.post(
    '/lights/:id/state',
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const { on, brightness, colorTemp, hue: hueValue, sat } = req.body ?? {};
      await hue.setLightState(id, {
        on: typeof on === 'boolean' ? on : undefined,
        bri: typeof brightness === 'number' ? brightness : undefined,
        ct: typeof colorTemp === 'number' ? colorTemp : undefined,
        hue: typeof hueValue === 'number' ? hueValue : undefined,
        sat: typeof sat === 'number' ? sat : undefined,
      });
      const lights = await status.getLights(true);
      res.json({ ok: true, lights });
    }),
  );

  router.post(
    '/lights/apply-scene',
    asyncHandler(async (req, res) => {
      const { presetId, sceneId, roomId } = req.body ?? {};
      if (presetId) {
        const preset = PRESET_SCENES.find((scene) => scene.id === presetId);
        if (!preset) {
          res.status(404).json({ error: 'scene_not_found', message: `Unknown preset: ${presetId}` });
          return;
        }
        status.setActiveEffect(null);
        await hue.stopEffect().catch(() => undefined);
        await hue.applyStateToAllLights({
          on: true,
          bri: preset.brightness,
          ct: preset.colorTemp,
        });
        const lights = await status.getLights(true);
        res.json({ ok: true, lights });
        return;
      }
      if (sceneId) {
        const groupId = roomId ? String(roomId) : '0';
        await hue.applySceneToGroup(groupId, sceneId);
        const lights = await status.getLights(true);
        res.json({ ok: true, lights });
        return;
      }
      res.status(400).json({ error: 'scene_required', message: 'presetId or sceneId must be provided' });
    }),
  );

  router.get('/custom-scenes', (_req, res) => {
    res.json({ scenes: storage.getCustomScenes() });
  });

  router.post(
    '/custom-scenes',
    asyncHandler(async (req, res) => {
      const payload = parseCustomScenePayload(req.body);
      if (!payload) {
        res.status(400).json({ error: 'invalid_scene', message: 'Invalid custom scene payload' });
        return;
      }
      const scenes = storage.getCustomScenes();
      if (scenes.length >= MAX_CUSTOM_SCENES) {
        res.status(400).json({ error: 'scene_limit', message: 'Maximum number of custom scenes reached' });
        return;
      }
      const scene: CustomScene = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      const nextScenes = [...scenes, scene];
      storage.saveCustomScenes(nextScenes);
      status.setCustomScenes(nextScenes);
      res.status(201).json(scene);
    }),
  );

  router.delete(
    '/custom-scenes/:id',
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const scenes = storage.getCustomScenes();
      const index = scenes.findIndex((scene) => scene.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'scene_not_found', message: `Unknown custom scene ${id}` });
        return;
      }
      const nextScenes = [...scenes.slice(0, index), ...scenes.slice(index + 1)];
      storage.saveCustomScenes(nextScenes);
      status.setCustomScenes(nextScenes);
      res.json({ ok: true });
    }),
  );

  router.post(
    '/custom-scenes/:id/apply',
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const scene = storage.getCustomScenes().find((entry) => entry.id === id);
      if (!scene) {
        res.status(404).json({ error: 'scene_not_found', message: `Unknown custom scene ${id}` });
        return;
      }
      status.setActiveEffect(null);
      await hue.stopEffect().catch(() => undefined);
      await hue.applyStateToAllLights({
        on: true,
        bri: scene.brightness,
        ct: scene.colorTemp,
        hue: scene.hue,
        sat: scene.sat,
      });
      const lights = await status.getLights(true);
      res.json({ ok: true, lights });
    }),
  );

  router.get(
    '/groups',
    asyncHandler(async (_req, res) => {
      const groups = await status.getGroups(true);
      res.json({ groups });
    }),
  );

  router.post(
    '/groups/:id/state',
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { on, brightness, colorTemp, hue: hueValue, sat } = req.body ?? {};
      await hue.applyStateToGroup(id, {
        on: typeof on === 'boolean' ? on : undefined,
        bri: typeof brightness === 'number' ? brightness : undefined,
        ct: typeof colorTemp === 'number' ? colorTemp : undefined,
        hue: typeof hueValue === 'number' ? hueValue : undefined,
        sat: typeof sat === 'number' ? sat : undefined,
      });
      const lights = await status.getLights(true);
      res.json({ ok: true, lights });
    }),
  );

  router.get(
    '/scenes',
    asyncHandler(async (_req, res) => {
      const hueScenes = await status.getHueScenes();
      res.json({ presets: PRESET_SCENES, hueScenes });
    }),
  );

  router.get('/effects', (_req, res) => {
    res.json({ effects: LIGHT_EFFECTS });
  });

  router.post(
    '/effects/start',
    asyncHandler(async (req, res) => {
      const { effectId, settings } = req.body ?? {};
      if (typeof effectId !== 'string') {
        res.status(400).json({ error: 'effect_required', message: 'effectId must be provided' });
        return;
      }
      await hue.startEffect(effectId, settings ?? {});
      status.setActiveEffect(effectId);
      res.json({ ok: true });
    }),
  );

  router.post(
    '/effects/stop',
    asyncHandler(async (_req, res) => {
      await hue.stopEffect();
      status.setActiveEffect(null);
      res.json({ ok: true });
    }),
  );

  router.get('/schedule', (_req, res) => {
    res.json({ schedules: scheduler.getSchedules() });
  });

  router.put(
    '/schedule',
    asyncHandler(async (req, res) => {
      const schedules = Array.isArray(req.body?.schedules) ? req.body.schedules : null;
      if (!schedules || !schedules.every(isScheduleEntry)) {
        res.status(400).json({ error: 'invalid_schedule', message: 'schedules array is invalid' });
        return;
      }
      scheduler.updateSchedules(schedules);
      status.setSchedules(schedules);
      res.json({ schedules });
    }),
  );

  router.patch(
    '/schedule/:id',
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const current = scheduler.getSchedules();
      const idx = current.findIndex((entry) => entry.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'schedule_not_found', message: `Unknown schedule ${id}` });
        return;
      }
      const updated = { ...current[idx], ...req.body };
      if (!isScheduleEntry(updated)) {
        res.status(400).json({ error: 'invalid_schedule', message: 'Updated schedule is invalid' });
        return;
      }
      const next = [...current];
      next[idx] = updated;
      scheduler.updateSchedules(next);
      status.setSchedules(next);
      res.json(updated);
    }),
  );

  router.get('/location', (_req, res) => {
    res.json({ location: scheduler.getLocation() });
  });

  router.post(
    '/location',
    asyncHandler(async (req, res) => {
      const { latitude, longitude, city, country } = req.body ?? {};
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        res.status(400).json({ error: 'invalid_coordinates', message: 'latitude and longitude are required numbers' });
        return;
      }
      const location = { latitude, longitude, city, country };
      scheduler.updateLocation(location);
      status.setLocation(location);
      res.json(location);
    }),
  );

  router.post(
    '/location/detect',
    asyncHandler(async (_req, res) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(LOCATION_ENDPOINT, { signal: controller.signal });
        if (!response.ok) {
          res.status(503).json({ error: 'location_unavailable', message: 'Location service unavailable' });
          return;
        }
        const data = await response.json();
        const latitude = Number(data.latitude ?? data.lat);
        const longitude = Number(data.longitude ?? data.lon ?? data.lng);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          res.status(503).json({ error: 'location_invalid', message: 'Location service returned invalid response' });
          return;
        }
        const location = {
          latitude,
          longitude,
          city: data.city ?? data.city_name,
          country: data.country_name ?? data.country,
        };
        scheduler.updateLocation(location);
        status.setLocation(location);
        res.json(location);
      } catch (error) {
        res.status(503).json({ error: 'location_error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  router.get('/bridge', (_req, res) => {
    const bridge = storage.getBridge();
    res.json({ bridge: bridge ? { ip: bridge.ip, configured: true } : { configured: false } });
  });

  router.get(
    '/bridge/discover',
    asyncHandler(async (_req, res) => {
      const ips = await hue.discover();
      res.json({ bridges: ips.map((ip) => ({ ip })) });
    }),
  );

  router.post(
    '/bridge/pair',
    asyncHandler(async (req, res) => {
      const { ip } = req.body ?? {};
      if (typeof ip !== 'string' || !ip) {
        res.status(400).json({ error: 'ip_required', message: 'Bridge IP address is required' });
        return;
      }
      try {
        await hue.pair(ip);
        res.json({ ok: true });
      } catch (error) {
        if (error instanceof Error && error.message === 'link_button_not_pressed') {
          res
            .status(428)
            .json({ error: 'link_button_not_pressed', message: 'Press the Hue bridge link button before pairing.' });
          return;
        }
        throw error;
      }
    }),
  );

  router.post(
    '/bridge/clear',
    asyncHandler(async (_req, res) => {
      hue.forgetBridge();
      res.json({ ok: true });
    }),
  );

  return router;
}
