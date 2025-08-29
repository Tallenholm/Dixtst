import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { dbQueryDuration } from '../lib/metrics';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const originalQuery = pool.query.bind(pool);
pool.query = async (...args: any[]) => {
  const end = dbQueryDuration.startTimer();
  try {
    return await originalQuery(...args);
  } finally {
    end();
  }
};

export const db = drizzle(pool);
export { pool };
export default db;
