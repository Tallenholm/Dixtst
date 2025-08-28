import express from 'express';
import https, { ServerOptions } from 'https';
import { WebSocketServer } from 'ws';
import { storage } from './storage';
import { HueBridgeService } from './services/hue-bridge';
import { MusicMode } from './services/music-mode';
import { Scheduler } from './services/scheduler';
import { createOverridesRouter } from './routes/overrides';
import { createMusicRouter } from './routes/music';
import { createVibeRouter } from './routes/vibe';
import { createSleepRouter } from './routes/sleep';
import { asyncHandler } from './lib/asyncHandler';
import { requireRoomRole } from './lib/roles';
import { authMiddleware } from './lib/auth';
import db from './services/db';
import { PermissionsRepository } from './repositories/permissions';
import { ZodError } from 'zod';
import { RoomsRepository } from './repositories/rooms';
import { RoomsService } from './services/rooms';
import { RoomsController } from './controllers/rooms';
import { MusicController } from './controllers/music';
import { OverridesController } from './controllers/overrides';
import { VibeController } from './controllers/vibe';
import { SleepController } from './controllers/sleep';
import { SunController } from './controllers/sun';
import { BridgesController } from './controllers/bridges';
import { LightsController } from './controllers/lights';
import { LocationController } from './controllers/location';
import { AnalyticsController } from './controllers/analytics';
import { ScheduleController } from './controllers/schedule';
import { EffectsController } from './controllers/effects';
import logger from './lib/logger';
import { wsConnections } from './lib/metrics';

export async function registerRoutes(app: ReturnType<typeof express>, httpsOptions: ServerOptions) {
  const server = https.createServer(httpsOptions, app);
  const wss = new WebSocketServer({ server });
  const hueBridge = new HueBridgeService(storage);
  const music = new MusicMode(storage, hueBridge);
  const scheduler = new Scheduler();

  wss.on('connection', (ws) => {
    wsConnections.inc();
    ws.on('close', () => wsConnections.dec());
    ws.send(JSON.stringify({ type: 'welcome' }));
  });

  const permissions = new PermissionsRepository(db);
  const roomsController = new RoomsController(
    new RoomsService(new RoomsRepository(hueBridge), permissions)
  );
  const musicController = new MusicController(music);
  const overridesController = new OverridesController(storage);
  const vibeController = new VibeController(hueBridge);
  const sleepController = new SleepController(hueBridge, scheduler);
  const sunController = new SunController();
  const bridgesController = new BridgesController(hueBridge);
  const lightsController = new LightsController(hueBridge);
  const locationController = new LocationController(storage);
  const analyticsController = new AnalyticsController(storage);
  const scheduleController = new ScheduleController(storage, permissions);
  const effectsController = new EffectsController(hueBridge);

  app.use('/api/overrides', createOverridesRouter(overridesController));
  app.use('/api', createVibeRouter(vibeController));
  app.use('/api', createMusicRouter(musicController));
  app.use('/api', createSleepRouter(sleepController));

  // Core for UI
  app.get('/api/rooms', asyncHandler(roomsController.listRooms));
  app.get('/api/scenes', asyncHandler(roomsController.listScenes));
  app.post('/api/rooms/:roomId/scene/apply', authMiddleware, requireRoomRole('roomId'), asyncHandler(roomsController.applyScene));
  app.post('/api/rooms/:roomId/toggle', authMiddleware, requireRoomRole('roomId'), asyncHandler(roomsController.toggleRoom));

  // Sun aliases
  app.get('/api/sun-times', sunController.getSunTimes);
  app.get('/api/current-phase', sunController.getCurrentPhase);

  // Pairing (compat)
  app.get('/api/bridges', asyncHandler(bridgesController.list));
  app.post('/api/bridges/discover', asyncHandler(bridgesController.discover));
  app.post('/api/bridges/:bridgeId/pair', asyncHandler(bridgesController.pair));

  // Lights (compat)
  app.get('/api/lights', asyncHandler(lightsController.list));
  app.post('/api/rooms', asyncHandler(async (_req, res) => { res.json({ ok: true }) }));
  app.get('/api/scenes/current', asyncHandler(lightsController.currentScene));
  app.post('/api/scenes/apply', asyncHandler(lightsController.applyScene));
  // System status & location (compat)
  app.get('/api/system/status', asyncHandler(async (_req, res) => { res.json({ engine: true, updates: true, schedule: true, lastUpdate: new Date().toISOString() }) }));
  app.get('/api/location', asyncHandler(locationController.get));
  app.post('/api/location', asyncHandler(locationController.set));
  app.post('/api/location/detect', asyncHandler(locationController.detect));

  app.get('/api/analytics', asyncHandler(analyticsController.get));

  // Schedules (compat shell)
  app.get('/api/schedule/sun-times', scheduleController.sunTimes);
  app.get('/api/schedule/current-phase', scheduleController.currentPhase);
  app.get('/api/schedule', asyncHandler(scheduleController.list));
  app.post('/api/schedule', authMiddleware, asyncHandler(scheduleController.set));
  app.patch('/api/schedule/:id', authMiddleware, asyncHandler(scheduleController.patch));

  // Effects (compat shell)
  app.post('/api/lights/sleep-mode', asyncHandler(effectsController.sleepMode));
  app.post('/api/lights/wake-up', asyncHandler(effectsController.wakeUp));
  app.post('/api/effects/start', asyncHandler(effectsController.start));
  app.post('/api/effects/stop', asyncHandler(effectsController.stop));

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: err.message });
    logger.error(err);
    res.status(500).json({ error: err.message });
  });

  return server;
}
