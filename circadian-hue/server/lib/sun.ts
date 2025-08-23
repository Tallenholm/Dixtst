import SunCalc from 'suncalc'

type SunTimes = { sunrise:Date, sunset:Date, civilTwilightBegin:Date, civilTwilightEnd:Date }
const cache = new Map<string, SunTimes>()
const keyFor = (lat:number, lng:number, date:Date)=> {
  const rLat = Math.round(lat*100)/100
  const rLng = Math.round(lng*100)/100
  const day = date.toISOString().slice(0,10)
  return `${rLat}:${rLng}:${day}`
}

export class CoordinateRangeError extends RangeError {
  constructor(public coord:'lat'|'lng', public value:number) {
    super(`${coord} out of range: ${value}`)
    this.name = 'CoordinateRangeError'
  }
}

export function getSunTimes(lat:number, lng:number, date=new Date()): SunTimes {
  if (lat < -90 || lat > 90) throw new CoordinateRangeError('lat', lat)
  if (lng < -180 || lng > 180) throw new CoordinateRangeError('lng', lng)
  const key = keyFor(lat, lng, date)
  let t = cache.get(key)
  if (!t) {
    const c = SunCalc.getTimes(date, lat, lng)
    t = { sunrise:c.sunrise, sunset:c.sunset, civilTwilightBegin:c.dawn, civilTwilightEnd:c.dusk }
    cache.set(key, t)
  }
  return t
}

export type Phase = 'night'|'dawn'|'day'|'dusk'
export function getCurrentPhase(lat:number, lng:number, date=new Date()): Phase {
  const t = getSunTimes(lat, lng, date)
  const n = +date
  if (n < +t.civilTwilightBegin) return 'night'
  if (n < +t.sunrise) return 'dawn'
  if (n < +t.civilTwilightEnd) return 'day'
  return 'dusk'
}
