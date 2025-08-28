import type { IStorage } from "../storage";
import { DEFAULT_PROFILES } from "./profiles";
import SunCalc from "suncalc";

export type ScheduleEntry = {
  start: string; // HH:mm or keyword like 'sunrise'
  end: string;   // HH:mm or keyword like 'sunrise'
  bri?: number;
  ct?: number;
  profileKey?: string;
  dnd?: boolean;
  sceneId?: string;
  /** Days this entry applies to. If omitted, applies every day. */
  days?: ("weekday" | "weekend")[];
  /** Offset in minutes from the calculated sunrise time when using 'sunrise'. */
  sunriseOffset?: number;
};

const key = (roomId: string) => `schedule:room:${roomId}`;

export async function getRoomSchedule(s: IStorage, id: string) {
  const v = await s.getSetting<ScheduleEntry[]>(key(id));
  return v?.value || [];
}

export async function setRoomSchedule(s: IStorage, id: string, entries: ScheduleEntry[]) {
  return s.setSetting(key(id), entries);
}

const mins = (t: string) => {
  const [h, m] = t.split(":").map(n => parseInt(n, 10));
  return (h * 60 + m) % (24 * 60);
};

const toTimeString = (totalMins: number) => {
  const m = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
};

const isWeekend = (d: Date) => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

export function findActiveEntry(
  entries: ScheduleEntry[],
  now = new Date(),
  opts: { latitude?: number; longitude?: number } = {},
): ScheduleEntry | undefined {
  const { latitude = 0, longitude = 0 } = opts;
  const sunTimes = SunCalc.getTimes(now, latitude, longitude);
  const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const weekend = isWeekend(now);

  for (const e of entries) {
    if (e.days) {
      if (weekend && !e.days.includes("weekend")) continue;
      if (!weekend && !e.days.includes("weekday")) continue;
    }

    let start = e.start;
    let end = e.end;
    if (e.sunriseOffset !== undefined) {
      if (e.start === "sunrise") {
        start = toTimeString(sunriseMinutes + e.sunriseOffset);
      }
      if (e.end === "sunrise") {
        end = toTimeString(sunriseMinutes + e.sunriseOffset);
      }
    }

    const a = mins(start);
    const b = mins(end);
    const within = a <= b ? currentMinutes >= a && currentMinutes < b : currentMinutes >= a || currentMinutes < b;
    if (within) return e;
  }
  return undefined;
}

export function entryToState(e: ScheduleEntry) {
  if (!e) return {} as any;
  if (e.profileKey) {
    const p = DEFAULT_PROFILES.find(x => x.key === e.profileKey);
    if (p) return { bri: p.bri, ct: p.ct, dnd: e.dnd };
  }
  return { bri: e.bri, ct: e.ct, dnd: e.dnd, sceneId: e.sceneId };
}

