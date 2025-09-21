import { formatISO } from 'date-fns';
import type { CircadianPhase, CircadianTimelineEntry, LocationInfo, ScheduleEntry } from '@shared/types';
import { CIRCADIAN_PHASE_SETTINGS } from '@shared/constants';
import { getCurrentPhase, getNextPhaseChange, getSunTimes } from '../utils/sun';
import { HueBridgeService } from './hue';
import { Storage } from '../storage';

interface ScheduleRunState {
  wake?: string;
  sleep?: string;
}

function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function createDateForTime(now: Date, time: string): Date | null {
  const parsed = parseTime(time);
  if (!parsed) return null;
  const result = new Date(now);
  result.setHours(parsed.hours, parsed.minutes, 0, 0);
  return result;
}

export class CircadianScheduler {
  private currentPhase: CircadianPhase = 'night';
  private nextPhaseAt?: Date;
  private interval?: NodeJS.Timeout;
  private readonly scheduleRuns = new Map<string, ScheduleRunState>();
  private location?: LocationInfo;
  private schedules: ScheduleEntry[] = [];
  private timeline: CircadianTimelineEntry[] = [];

  constructor(
    private readonly hue: HueBridgeService,
    private readonly storage: Storage,
    private readonly onPhaseChange?: (phase: CircadianPhase, nextAt?: Date) => void,
    private readonly onTimelineChange?: (timeline: CircadianTimelineEntry[]) => void,
  ) {
    this.location = storage.getLocation();
    this.schedules = storage.getSchedules();
    if (this.location) {
      this.recomputeTimeline();
    }
  }

  start() {
    if (this.interval) return;
    this.recomputeTimeline();
    this.tick(true).catch((error) => console.warn('Initial circadian tick failed', error));
    this.interval = setInterval(() => {
      this.tick().catch((error) => console.warn('Circadian tick failed', error));
    }, 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  getPhase(): { phase: CircadianPhase; next?: Date } {
    return { phase: this.currentPhase, next: this.nextPhaseAt };
  }

  getLocation(): LocationInfo | undefined {
    return this.location;
  }

  getSchedules(): ScheduleEntry[] {
    return this.schedules;
  }

  getTimeline(): CircadianTimelineEntry[] {
    return this.timeline;
  }

  updateLocation(location: LocationInfo) {
    this.location = location;
    this.storage.saveLocation(location);
    this.recomputeTimeline();
    this.tick(true).catch((error) => console.warn('Failed to apply phase after location update', error));
  }

  updateSchedules(schedules: ScheduleEntry[]) {
    this.schedules = schedules;
    this.storage.saveSchedules(schedules);
    this.scheduleRuns.clear();
  }

  private async tick(forcePhase = false) {
    const now = new Date();
    this.recomputeTimeline(now);
    if (!this.location) return;
    const phase = getCurrentPhase(this.location.latitude, this.location.longitude, now);
    if (forcePhase || phase !== this.currentPhase) {
      this.currentPhase = phase;
      this.nextPhaseAt = getNextPhaseChange(phase, this.location.latitude, this.location.longitude, now);
      if (!this.hue.getActiveEffect()) {
        const setting = CIRCADIAN_PHASE_SETTINGS[phase];
        if (setting) {
          await this.hue
            .applyStateToAllLights({ on: true, bri: setting.brightness, ct: setting.colorTemp })
            .catch((error) => console.warn('Failed to apply circadian phase', error));
        }
      }
      this.onPhaseChange?.(phase, this.nextPhaseAt);
    }
    await this.processSchedules(now);
  }

  private recomputeTimeline(now = new Date()) {
    if (!this.location) {
      if (this.timeline.length) {
        this.timeline = [];
        this.onTimelineChange?.([]);
      }
      return;
    }

    const segments = buildDailyTimeline(this.location, now);
    this.timeline = segments;
    this.onTimelineChange?.(segments);
  }

  private async processSchedules(now: Date) {
    if (!this.schedules.length) return;
    const todayKey = formatISO(now, { representation: 'date' });
    for (const schedule of this.schedules) {
      if (!schedule.enabled) continue;
      if (schedule.days && schedule.days.length > 0 && !schedule.days.includes(now.getDay())) continue;
      const state = this.scheduleRuns.get(schedule.id) ?? {};
      const wakeTime = createDateForTime(now, schedule.wakeTime);
      if (wakeTime && now >= wakeTime && state.wake !== todayKey) {
        await this.applyWake(schedule);
        state.wake = todayKey;
      }
      const sleepTime = createDateForTime(now, schedule.sleepTime);
      if (sleepTime && now >= sleepTime && state.sleep !== todayKey) {
        await this.applySleep(schedule);
        state.sleep = todayKey;
      }
      this.scheduleRuns.set(schedule.id, state);
    }
  }

  private async applyWake(schedule: ScheduleEntry) {
    if (this.hue.getActiveEffect()) {
      await this.hue.stopEffect().catch(() => undefined);
    }
    const brightness = schedule.wakeBrightness ?? 220;
    const colorTemp = schedule.wakeColorTemp ?? 260;
    await this.hue
      .applyStateToAllLights({ on: true, bri: brightness, ct: colorTemp })
      .catch((error) => console.warn(`Failed to apply wake schedule ${schedule.id}`, error));
  }

  private async applySleep(schedule: ScheduleEntry) {
    if (this.hue.getActiveEffect()) {
      await this.hue.stopEffect().catch(() => undefined);
    }
    const brightness = schedule.sleepBrightness ?? 60;
    const colorTemp = schedule.sleepColorTemp ?? 420;
    await this.hue
      .applyStateToAllLights({ on: true, bri: brightness, ct: colorTemp })
      .catch((error) => console.warn(`Failed to apply sleep schedule ${schedule.id}`, error));
  }
}

function buildDailyTimeline(location: LocationInfo, reference: Date): CircadianTimelineEntry[] {
  const { latitude, longitude } = location;
  const startOfDay = new Date(reference);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const times = getSunTimes(latitude, longitude, reference);

  const segments: CircadianTimelineEntry[] = [];
  const pushSegment = (phase: CircadianPhase, start: Date, end: Date) => {
    const setting = CIRCADIAN_PHASE_SETTINGS[phase];
    if (!setting) return;
    const clampedStart = new Date(Math.max(start.getTime(), startOfDay.getTime()));
    const clampedEnd = new Date(Math.min(end.getTime(), endOfDay.getTime()));
    if (clampedEnd.getTime() <= clampedStart.getTime()) return;
    segments.push({
      phase,
      start: clampedStart.toISOString(),
      end: clampedEnd.toISOString(),
      brightness: setting.brightness,
      colorTemp: setting.colorTemp,
    });
  };

  pushSegment('night', startOfDay, times.civilTwilightBegin);
  pushSegment('dawn', times.civilTwilightBegin, times.sunrise);
  pushSegment('day', times.sunrise, times.civilTwilightEnd);
  pushSegment('dusk', times.civilTwilightEnd, endOfDay);

  return segments;
}
