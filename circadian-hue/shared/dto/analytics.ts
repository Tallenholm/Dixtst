import { z } from 'zod'

export const PhaseDistributionSchema = z.object({
  phase: z.string(),
  hours: z.number(),
  percentage: z.number(),
})

export const AnalyticsSchema = z.object({
  todayUsage: z.object({
    totalHours: z.number(),
    circadianHours: z.number(),
    manualOverrides: z.number(),
    energySaved: z.number(),
  }),
  weeklyTrends: z.array(z.any()),
  phaseDistribution: z.array(PhaseDistributionSchema),
  healthMetrics: z.object({
    circadianScore: z.number(),
    sleepScheduleConsistency: z.number(),
    lightExposureBalance: z.number(),
    wellnessIndex: z.number(),
  }),
})
export type AnalyticsDTO = z.infer<typeof AnalyticsSchema>
