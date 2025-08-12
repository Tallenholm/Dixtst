import { v3 } from 'node-hue-api'
import type { IStorage } from "../storage"
type BridgeAuth={ ip:string; username:string }
export class HueBridgeService {
  private storage: IStorage; private api?: any;
  constructor(storage:IStorage){ this.storage=storage }
  private async getAuth(): Promise<BridgeAuth|undefined>{ const s=await this.storage.getSetting('bridge_auth'); return s?.value }
  private async saveAuth(a:BridgeAuth){ await this.storage.setSetting('bridge_auth', a) }
  async discover(){ const r=await v3.discovery.nupnpSearch(); return r.map((b:any)=>b.ipaddress).filter(Boolean) }
  async pairWithLinkButton(ip:string, appName='circadian-hue', deviceName='server'){ const unauth=await v3.api.createLocal(ip).connect(); try{ const user=await unauth.users.createUser(appName, deviceName); const a={ip, username:user.username}; await this.saveAuth(a); this.api=await v3.api.createLocal(ip).connect(user.username); return a } catch(e:any){ throw new Error(e?.getHueErrorType?.()===101?'link_button_not_pressed':(e?.message||'pair_failed')) } }
  private async ensureApi(){ if(this.api) return this.api; let ip=process.env.HUE_BRIDGE_IP, username=process.env.HUE_USERNAME; if(!ip||!username){ const a=await this.getAuth(); if(a){ ip=a.ip; username=a.username } } if(ip&&username){ this.api=await v3.api.createLocal(ip).connect(username); return this.api } const ips=await this.discover(); if(ips.length){ return v3.api.createLocal(ips[0]).connect() } throw new Error('bridge_not_configured') }
  async refreshLights(){ const api=await this.ensureApi(); const lights=await api.lights.getAll(); return lights.map((l:any)=>({ id:String(l.id), name:l.name, isOn:!!l.state.on, brightness:l.state.bri??0, colorTemp:l.state.ct??0, updatedAt:new Date() })) }
  async setLightState(lightId:string, state:{on?:boolean;bri?:number;ct?:number}){ const api=await this.ensureApi(); const st=new v3.lightStates.LightState(); if(state.on!==undefined) state.on? st.on(): st.off(); if(typeof state.bri==='number') st.brightness(Math.max(1,Math.min(254,state.bri))); if(typeof state.ct==='number') st.ct(Math.max(153,Math.min(500,state.ct))); return api.lights.setLightState(lightId, st) }
  async applyStateToAllLights(state:{on?:boolean;bri?:number;ct?:number}){ const api=await this.ensureApi(); const st=new v3.lightStates.GroupLightState(); if(state.on!==undefined) state.on? st.on(): st.off(); if(typeof state.bri==='number') st.brightness(Math.max(1,Math.min(254,state.bri))); if(typeof state.ct==='number') st.ct(Math.max(153,Math.min(500,state.ct))); try{ await api.groups.setGroupState(0, st); return true } catch { const lights=await api.lights.getAll(); for(const l of lights){ await api.lights.setLightState(l.id, st) } return true } }
  async listRooms(){ const api=await this.ensureApi(); const groups=await api.groups.getAll(); return groups.filter((g:any)=>['Room','Zone'].includes(g.type)).map((g:any)=>({ id:String(g.id), name:g.name, type:g.type, lights:(g.lights||[]).map((l:any)=>String(l)) })) }
  async getRoomLightIds(roomId:string){ const api=await this.ensureApi(); const g=await api.groups.getGroup(roomId); return (g?.lights||[]).map((l:any)=>String(l)) }
  async listScenes(){ const api=await this.ensureApi(); if(!api.scenes) return []; const scenes=await api.scenes.getAll(); return scenes.map((s:any)=>({ id:String(s.id), name:s.name, groupId: s.group || s.groupid || s.groupId })) }
  async applySceneToGroup(groupId:string, sceneId:string){ const api=await this.ensureApi(); const st=new v3.lightStates.GroupLightState().scene(sceneId); try{ await api.groups.setGroupState(groupId, st); return true } catch{ if(api.scenes?.activateScene){ await api.scenes.activateScene(sceneId); return true } throw new Error('scene_apply_failed') } }
}
