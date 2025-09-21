import SunCalc from 'suncalc';

export type SunTimes = {
  sunrise: Date;
  sunset: Date;
  civilTwilightBegin: Date;
  civilTwilightEnd: Date;
};

type CacheEntry = { times: SunTimes; expires: number };

const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000; // 24h

const keyFor = (lat: number, lng: number, date: Date) => {
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  const day = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  return `${rLat}:${rLng}:${day}`;
};

export class CoordinateRangeError extends RangeError {
  constructor(public coord: 'lat' | 'lng', public value: number) {
    super(`${coord} out of range: ${value}`);
    this.name = 'CoordinateRangeError';
  }
}

export function getSunTimes(lat: number, lng: number, date = new Date()): SunTimes {
  if (lat < -90 || lat > 90) throw new CoordinateRangeError('lat', lat);
  if (lng < -180 || lng > 180) throw new CoordinateRangeError('lng', lng);
  const key = keyFor(lat, lng, date);
  const now = Date.now();
  let entry = cache.get(key);
  if (!entry || entry.expires <= now) {
    const c = SunCalc.getTimes(date, lat, lng);
    entry = {
      times: {
        sunrise: c.sunrise,
        sunset: c.sunset,
        civilTwilightBegin: c.dawn,
        civilTwilightEnd: c.dusk,
      },
      expires: now + TTL,
    };
    cache.set(key, entry);
  }
  return entry.times;
}

export type CircadianPhase = 'night' | 'dawn' | 'day' | 'dusk';

export function getCurrentPhase(lat: number, lng: number, date = new Date()): CircadianPhase {
  const t = getSunTimes(lat, lng, date);
  const n = date.getTime();
  if (n < t.civilTwilightBegin.getTime()) return 'night';
  if (n < t.sunrise.getTime()) return 'dawn';
  if (n < t.civilTwilightEnd.getTime()) return 'day';
  return 'dusk';
}

export function getNextPhaseChange(
  phase: CircadianPhase,
  lat: number,
  lng: number,
  date = new Date(),
): Date {
  const sameDay = getSunTimes(lat, lng, date);
  switch (phase) {
    case 'night':
      return sameDay.civilTwilightBegin;
    case 'dawn':
      return sameDay.sunrise;
    case 'day':
      return sameDay.civilTwilightEnd;
    case 'dusk': {
      const tomorrow = new Date(date);
      tomorrow.setDate(date.getDate() + 1);
      const next = getSunTimes(lat, lng, tomorrow);
      return next.civilTwilightBegin;
    }
    default:
      return new Date(date.getTime() + 60 * 60 * 1000);
  }
}
