import pino from 'pino'

const redact = () => '[redacted]'

const logger = pino({
  level: process.env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  serializers: {
    token: redact,
    accessToken: redact,
    refreshToken: redact,
    userId: redact,
  },
})

export default logger
