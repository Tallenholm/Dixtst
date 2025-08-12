export type Setting = { key: string; value: any; updatedAt: Date }
export interface IStorage {
  getAllLights(): Promise<any[]>
  getAllSettings(): Promise<Setting[]>
  getSetting(key: string): Promise<Setting | undefined>
  setSetting(key: string, value: any): Promise<Setting>
  deleteSetting(key: string): Promise<boolean>
}
class MemStorage implements IStorage {
  lights = new Map<string, any>()
  settings = new Map<string, Setting>()
  async getAllLights(){ return Array.from(this.lights.values()) }
  async getAllSettings(){ return Array.from(this.settings.values()) }
  async getSetting(key:string){ return this.settings.get(key) }
  async setSetting(key:string, value:any){ const s={ key, value, updatedAt: new Date() }; this.settings.set(key,s); return s }
  async deleteSetting(key:string){ return this.settings.delete(key) }
}
export const storage: IStorage = new MemStorage()
