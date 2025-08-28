import { z } from 'zod'

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data)
}
