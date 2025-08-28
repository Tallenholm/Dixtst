import { Router } from 'express'
import { AuthController } from '../controllers/auth'
import { asyncHandler } from '../lib/asyncHandler'

export function createAuthRouter(controller: AuthController) {
  const router = Router()
  router.post('/login', asyncHandler(controller.login.bind(controller)))
  router.post('/refresh', asyncHandler(controller.refresh.bind(controller)))
  return router
}
