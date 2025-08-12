import SunCalc from 'suncalc'
export function getSunTimes(lat:number, lng:number, date=new Date()) {
  const t = SunCalc.getTimes(date, lat, lng)
  return { sunrise:t.sunrise, sunset:t.sunset, civilTwilightBegin:t.dawn, civilTwilightEnd:t.dusk }
}
export type Phase = 'night'|'dawn'|'day'|'dusk'
export function getCurrentPhase(lat:number, lng:number, date=new Date()): Phase {
  const t = getSunTimes(date, lat, lng)
  const n = +date
  if (n < +t.civilTwilightBegin) return 'night'
  if (n < +t.sunrise) return 'dawn'
  if (n < +t.civilTwilightEnd) return 'day'
  return 'dusk'
}
