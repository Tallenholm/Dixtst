import type { IStorage } from "../storage"; import { DEFAULT_PROFILES } from "./profiles"
export type ScheduleEntry = { start:string; end:string; bri?:number; ct?:number; profileKey?:string; dnd?:boolean; sceneId?:string }
const key=(roomId:string)=>`schedule:room:${roomId}`
export async function getRoomSchedule(s:IStorage, id:string){ const v=await s.getSetting<ScheduleEntry[]>(key(id)); return v?.value||[] }
export async function setRoomSchedule(s:IStorage, id:string, entries:ScheduleEntry[]){ return s.setSetting(key(id), entries) }
const mins=(t:string)=>{ const [h,m]=t.split(':').map(n=>parseInt(n,10)); return (h*60+m)%(24*60) }
export function findActiveEntry(entries:ScheduleEntry[], now=new Date()){ const x=now.getHours()*60+now.getMinutes(); for(const e of entries){ const a=mins(e.start), b=mins(e.end); if(a<=b? (x>=a&&x<b):(x>=a||x<b)) return e } return undefined }
export function entryToState(e:ScheduleEntry){ if(!e) return {}; if(e.profileKey){ const p=DEFAULT_PROFILES.find(x=>x.key===e.profileKey); if(p) return { bri:p.bri, ct:p.ct, dnd:e.dnd } } return { bri:e.bri, ct:e.ct, dnd:e.dnd, sceneId:e.sceneId } }
