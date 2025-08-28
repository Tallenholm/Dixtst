import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from './lib/auth'
import { registerRoutes } from './routes'
import { AuthController } from './controllers/auth'
import { AuthRepository } from './repositories/auth'
import { createAuthRouter } from './routes/auth'
import { db } from './services/db'

const app: Express = express()
app.use(express.json()); app.use(cors()); app.use(helmet())

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 })
app.use(limiter)

const authController = new AuthController(new AuthRepository(db))
app.use('/api/auth', createAuthRouter(authController))

app.use(authMiddleware)

registerRoutes(app)
  .then((server) => {
    const port = parseInt(process.env.PORT ?? '', 10)
    if (!port) throw new Error('PORT is required')
    server.listen(port, () => console.log('Server on', port))
  })
  .catch((error) => {
    console.error('Error starting server:', error)
    process.exit(1)
  })
