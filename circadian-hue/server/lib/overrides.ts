import type { IStorage } from "../storage"
export type Override = { on?:boolean; bri?:number; ct?:number; dnd?:boolean; until?:string; sceneId?:string }
const roomKey=(id:string)=>`override:room:${id}`; const lightKey=(id:string)=>`override:light:${id}`
export const setRoomOverride=(s:IStorage,id:string,ov:Override)=>s.setSetting(roomKey(id),ov)
export const clearRoomOverride=(s:IStorage,id:string)=>s.deleteSetting(roomKey(id))
export const getRoomOverride=(s:IStorage,id:string)=>s.getSetting<Override>(roomKey(id))
export const setLightOverride=(s:IStorage,id:string,ov:Override)=>s.setSetting(lightKey(id),ov)
export const clearLightOverride=(s:IStorage,id:string)=>s.deleteSetting(lightKey(id))
export const getLightOverride=(s:IStorage,id:string)=>s.getSetting<Override>(lightKey(id))
export async function listOverrides(storage:IStorage){ const all=await storage.getAllSettings(); const now=Date.now(); return all.filter(s=>String(s.key).startsWith('override:')).filter(s=>{const u=s.value?.until?Date.parse(s.value.until):undefined; return !u||u>now}) }
export function mergeState(base:{on?:boolean;bri?:number;ct?:number;sceneId?:string}, ov?:Override){ if(!ov) return base; return { on: ov.on ?? base.on, bri: ov.bri ?? base.bri, ct: ov.ct ?? base.ct, sceneId: ov.sceneId ?? base.sceneId } }
