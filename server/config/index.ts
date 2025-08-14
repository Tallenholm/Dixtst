import { config as loadEnv } from 'dotenv';

loadEnv();

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const DATABASE_URL = getEnv('DATABASE_URL', 'postgres://localhost:5432/postgres');
export default { DATABASE_URL };
