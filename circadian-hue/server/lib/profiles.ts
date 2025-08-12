export type Profile = { key:string; name:string; bri:number; ct:number }
export const DEFAULT_PROFILES: Profile[] = [
  { key:'evening_warm', name:'Evening Warm', bri:120, ct:370 },
  { key:'relax', name:'Relax', bri:90, ct:400 },
  { key:'focus', name:'Focus', bri:200, ct:220 },
  { key:'nightlight', name:'Night Light', bri:40, ct:430 }
]
