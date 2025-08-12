// Simple seeded PRNG + palette generator that maps to Hue CT + brightness
type Seedable = { seed?: string, warmth?: 'warm'|'cool'|'mixed', intensity?: 'chill'|'normal'|'hype' }
function mulberry32(a:number){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function strSeed(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h+= (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24) } return h>>>0 }
export type VibeState = { bri:number; ct:number; name:string }
export function rollVibe(opts: Seedable = {}): VibeState {
  const seed = strSeed((opts.seed || (Date.now().toString(36))) + (opts.warmth||'') + (opts.intensity||''))
  const rnd = mulberry32(seed)
  const warmth = opts.warmth || (rnd() < 0.5 ? 'warm' : 'cool')
  const intensity = opts.intensity || (rnd() < 0.33 ? 'chill' : rnd() < 0.66 ? 'normal' : 'hype')
  let baseCt = warmth==='warm' ? 380 : 230
  let jitterCt = (warmth==='mixed') ? (200 + Math.floor(rnd()*220)) : baseCt + Math.floor((rnd()-0.5)*60)
  jitterCt = Math.max(153, Math.min(500, jitterCt))
  let bri = intensity==='chill' ? 110 : intensity==='normal' ? 170 : 230
  bri = Math.max(1, Math.min(254, bri + Math.floor((rnd()-0.5)*40)))
  const name = `${warmth}/${intensity} #${(seed>>>0).toString(16).slice(-4)}`
  return { bri, ct: jitterCt, name }
}
