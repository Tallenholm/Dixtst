import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { registerRoutes } from './routes'
const app = express()
app.use(express.json()); app.use(cors()); app.use(helmet())
registerRoutes(app)
  .then((server) => {
    const port = parseInt(process.env.PORT || '3000', 10)
    server.listen(port, () => console.log('Server on', port))
  })
  .catch((error) => {
    console.error('Error starting server:', error)
    process.exit(1)
  })
