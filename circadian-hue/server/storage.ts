export interface Setting<T> { key: string; value: T; updatedAt: Date }

export interface Light {
  id: string;
  name: string;
  isOn: boolean;
  brightness: number;
  colorTemp: number;
  updatedAt: Date;
}

export interface IStorage {
  getAllLights(): Promise<Light[]>;
  getAllSettings(): Promise<Setting<unknown>[]>;
  getSetting<T>(key: string): Promise<Setting<T> | undefined>;
  setSetting<T>(key: string, value: T): Promise<Setting<T>>;
  deleteSetting(key: string): Promise<boolean>;
}

class MemStorage implements IStorage {
  lights = new Map<string, Light>();
  settings = new Map<string, Setting<unknown>>();

  async getAllLights(): Promise<Light[]> { return Array.from(this.lights.values()) }
  async getAllSettings(): Promise<Setting<unknown>[]> { return Array.from(this.settings.values()) }
  async getSetting<T>(key: string): Promise<Setting<T> | undefined> { return this.settings.get(key) as Setting<T> | undefined }
  async setSetting<T>(key: string, value: T): Promise<Setting<T>> { const s: Setting<T> = { key, value, updatedAt: new Date() }; this.settings.set(key, s); return s }
  async deleteSetting(key: string): Promise<boolean> { return this.settings.delete(key) }
}

export const storage: IStorage = new MemStorage()
