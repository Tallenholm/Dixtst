import type { IStorage } from "../storage"
export type DefaultState = { bri?:number; ct?:number; sceneId?:string }
const key=(roomId:string)=>`default:room:${roomId}`
export async function getRoomDefault(s:IStorage, id:string){ const v=await s.getSetting<DefaultState>(key(id)); return v?.value||undefined }
export async function setRoomDefault(s:IStorage, id:string, state:DefaultState){ return s.setSetting(key(id), state) }
export async function clearRoomDefault(s:IStorage, id:string){ return s.deleteSetting(key(id)) }
