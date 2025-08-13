import pino from 'pino';
import { createRequire } from 'module';

// Some environments used by tests do not have optional prettifier dependencies
// installed.  The logger falls back to a basic configuration when the
// prettifier cannot be resolved.
const require = createRequire(import.meta.url);

let transport: any;
try {
  require.resolve('pino-pretty');
  transport = {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  };
} catch {
  transport = undefined;
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(transport ? { transport } : {})
});

export default logger;
