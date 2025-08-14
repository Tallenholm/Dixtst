import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');
const defaultDbUrl = 'postgresql://user:pass@localhost:5432/circadian_hue';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  try {
    const answer = await question(`DATABASE_URL [${defaultDbUrl}]: `);
    const example = await fs.readFile(envExamplePath, 'utf8');
    const dbUrl = answer.trim() || defaultDbUrl;
    const populated = example.replace(/DATABASE_URL=.*/, `DATABASE_URL=${dbUrl}`);
    await fs.writeFile(envPath, populated, 'utf8');
    console.log('Wrote', envPath);
    rl.close();
  } catch (err) {
    rl.close();
    console.error('Failed to set up environment:', err.message);
    process.exit(1);
  }
}

main();
