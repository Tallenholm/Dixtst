import { z } from 'zod'

export const OverrideRequestSchema = z.object({
  on: z.boolean().optional(),
  bri: z.number().optional(),
  ct: z.number().optional(),
  dnd: z.boolean().optional(),
  until: z.string().optional(),
  sceneId: z.string().optional(),
})
export type OverrideRequest = z.infer<typeof OverrideRequestSchema>
