import { Router } from 'express'
import { OverridesController } from '../controllers/overrides'
import { asyncHandler } from '../lib/asyncHandler'

export function createOverridesRouter(controller: OverridesController) {
  const router = Router()

  router.get('/', asyncHandler(controller.list))
  router.post('/rooms/:roomId', asyncHandler(controller.set))
  router.delete('/rooms/:roomId', asyncHandler(controller.clear))

  return router
}
