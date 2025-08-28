import { Pool } from 'pg';
import { startOfDay, subDays, format } from 'date-fns';

export class AnalyticsService {
  constructor(private readonly db: Pool) {}

  async recordEvent(eventType: string, details: any = {}) {
    await this.db.query(
      'INSERT INTO usage_events(event_type, details) VALUES ($1, $2)',
      [eventType, details]
    );
  }

  async getAnalytics() {
    const todayStart = startOfDay(new Date());
    const todayRes = await this.db.query(
      'SELECT event_type, details FROM usage_events WHERE created_at >= $1',
      [todayStart]
    );
    const manualOverrides = todayRes.rows.filter(r => r.event_type === 'manual_override').length;
    const scheduleEvents = todayRes.rows.filter(r => r.event_type === 'schedule_phase');
    const totalEvents = todayRes.rowCount;
    const totalHours = totalEvents; // approximation
    const circadianHours = scheduleEvents.length;
    const energySaved = totalEvents ? Math.round((circadianHours / totalEvents) * 100) : 0;

    const phaseCounts: Record<string, number> = {};
    for (const row of scheduleEvents) {
      const phase = row.details?.phase as string | undefined;
      if (phase) phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    }
    const phaseDistribution = Object.entries(phaseCounts).map(([phase, count]) => ({
      phase,
      hours: count,
      percentage: totalEvents ? Math.round((count / totalEvents) * 100) : 0,
    }));

    const weekStart = startOfDay(subDays(new Date(), 6));
    const weekRes = await this.db.query(
      `SELECT date_trunc('day', created_at) as day,
              SUM(CASE WHEN event_type = 'schedule_phase' THEN 1 ELSE 0 END) AS schedule_followed,
              SUM(CASE WHEN event_type = 'manual_override' THEN 1 ELSE 0 END) AS overrides
         FROM usage_events
        WHERE created_at >= $1
        GROUP BY day
        ORDER BY day`,
      [weekStart]
    );

    const weeklyTrends: { day: string; circadianCompliance: number; sleepQuality: number; overrides: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = startOfDay(subDays(new Date(), 6 - i));
      const row = weekRes.rows.find(r => new Date(r.day).getTime() === dayDate.getTime());
      const overrides = row ? Number(row.overrides) : 0;
      const scheduleFollowed = row ? Number(row.schedule_followed) : 0;
      const compliance = scheduleFollowed ? 100 : 0;
      weeklyTrends.push({
        day: format(dayDate, 'EEE'),
        circadianCompliance: compliance,
        sleepQuality: Math.max(0, 100 - overrides * 10),
        overrides,
      });
    }

    const avgCompliance = weeklyTrends.reduce((a, b) => a + b.circadianCompliance, 0) / (weeklyTrends.length || 1);
    const lightExposureBalance = Math.max(0, 100 - manualOverrides * 10);
    const circadianScore = energySaved;
    const sleepScheduleConsistency = avgCompliance;
    const wellnessIndex = Math.round((circadianScore + sleepScheduleConsistency + lightExposureBalance) / 3);

    const suggestions: string[] = [];
    if (circadianScore < 60) suggestions.push('Increase time in circadian mode.');
    if (manualOverrides > 5) suggestions.push('Reduce manual overrides to improve consistency.');
    if (suggestions.length === 0) suggestions.push('Great job maintaining your routine!');

    return {
      todayUsage: {
        totalHours,
        circadianHours,
        manualOverrides,
        energySaved,
      },
      weeklyTrends,
      phaseDistribution,
      healthMetrics: {
        circadianScore,
        sleepScheduleConsistency,
        lightExposureBalance,
        wellnessIndex,
      },
      suggestions,
    };
  }
}
