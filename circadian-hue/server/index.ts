import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv-safe'
import convict from 'convict'
import { authMiddleware } from './lib/auth'
import { registerRoutes } from './routes'
import { AuthController } from './controllers/auth'
import { AuthRepository } from './repositories/auth'
import { createAuthRouter } from './routes/auth'
import { db } from './services/db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

loadEnv({
  path: path.join(__dirname, '../.env'),
  example: path.join(__dirname, '../.env.example'),
})

const config = convict({
  port: { format: 'port', env: 'PORT', default: 5000 },
  databaseUrl: { format: String, env: 'DATABASE_URL', default: '' },
  jwtSecret: { format: String, env: 'JWT_SECRET', default: '' },
  allowedOrigins: { format: String, env: 'ALLOWED_ORIGINS', default: '' },
  tlsCertPath: { format: String, env: 'TLS_CERT_PATH', default: '' },
  tlsKeyPath: { format: String, env: 'TLS_KEY_PATH', default: '' },
  vaultAddr: { format: String, env: 'VAULT_ADDR', default: '' },
  vaultToken: { format: String, env: 'VAULT_TOKEN', default: '' },
  vaultSecretPath: { format: String, env: 'VAULT_SECRET_PATH', default: '' },
})

async function loadVaultSecrets() {
  if (process.env.NODE_ENV !== 'production') return
  const addr = config.get('vaultAddr')
  const token = config.get('vaultToken')
  const secretPath = config.get('vaultSecretPath')
  if (!addr || !token || !secretPath) return
  const resp = await fetch(`${addr}/v1/${secretPath}`, {
    headers: { 'X-Vault-Token': token },
  })
  if (!resp.ok) throw new Error('Failed to load secrets from Vault')
  const json = await resp.json()
  config.load(json.data?.data ?? {})
}

async function start() {
  await loadVaultSecrets()
  config.validate({ allowed: 'strict' })

  const app = express()
  app.use(express.json())
  const origins = config.get('allowedOrigins')
  app.use(cors({ origin: origins ? origins.split(',') : [] }))
  app.use(helmet())
  app.use(cookieParser())
  app.use(csurf({ cookie: true }))

  const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 })
  app.use(limiter)

  const authController = new AuthController(new AuthRepository(db))
  app.use('/api/auth', createAuthRouter(authController))

  app.use(authMiddleware)

  const server = await registerRoutes(app, {
    key: fs.readFileSync(config.get('tlsKeyPath')),
    cert: fs.readFileSync(config.get('tlsCertPath')),
  })

  server.listen(config.get('port'), () =>
    console.log('Server on', config.get('port'))
  )
}

start().catch((error) => {
  console.error('Error starting server:', error)
  process.exit(1)
})

