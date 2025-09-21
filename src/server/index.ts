import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Storage } from './storage';
import { HueBridgeService } from './services/hue';
import { CircadianScheduler } from './services/circadian';
import { StatusService } from './services/status';
import { createApiRouter } from './routes/api';
import { createAccessControl } from './middleware/access-token';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const clientDist = path.join(rootDir, 'dist/client');

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const storage = new Storage(process.env.HUE_DB_PATH);
const hue = new HueBridgeService(storage);
const status = new StatusService(hue, storage);
const scheduler = new CircadianScheduler(
  hue,
  storage,
  (phase, next) => {
    status.setPhase(phase, next);
  },
  (timeline) => {
    status.setCircadianTimeline(timeline);
  },
);

status.setPhase(scheduler.getPhase().phase, scheduler.getPhase().next);
status.setLocation(storage.getLocation());
status.setSchedules(storage.getSchedules());
status.setCustomScenes(storage.getCustomScenes());
status.setCircadianTimeline(scheduler.getTimeline());

hue.setEffectListener((effect) => {
  status.setActiveEffect(effect);
});

scheduler.start();

app.use('/api', createAccessControl(), createApiRouter({ hue, scheduler, status, storage }));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'server_error', message: err?.message ?? 'Unexpected server error' });
});

const server = app.listen(port, () => {
  console.log(`Circadian Hue Home server listening on http://localhost:${port}`);
});

const shutdown = () => {
  console.log('Shutting down Circadian Hue server');
  scheduler.stop();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
