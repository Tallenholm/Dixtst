import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../lib/logger';

const connection = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL) : undefined;

export const sunriseQueue = connection ? new Queue('sunrise', { connection }) : undefined;
export const analyticsQueue = connection ? new Queue('analytics', { connection }) : undefined;

export const workers = connection
  ? [
      new Worker(
        'sunrise',
        async (job) => {
          logger.info({ jobId: job.id, minutes: job.data.minutes }, 'processing sunrise job');
        },
        { connection }
      ),
      new Worker(
        'analytics',
        async (job) => {
          logger.info({ jobId: job.id }, 'processing analytics job');
        },
        { connection }
      ),
    ]
  : [];

export async function shutdownJobs() {
  if (!connection) return;
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
}
