import { z } from 'zod'

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  lights: z.array(z.string()),
  isOn: z.boolean(),
  icon: z.string(),
})
export type RoomDTO = z.infer<typeof RoomSchema>

export const ApplySceneRequestSchema = z.object({
  sceneId: z.string(),
})
export type ApplySceneRequest = z.infer<typeof ApplySceneRequestSchema>

export const ToggleRoomRequestSchema = z.object({
  isOn: z.boolean().optional(),
})
export type ToggleRoomRequest = z.infer<typeof ToggleRoomRequestSchema>
