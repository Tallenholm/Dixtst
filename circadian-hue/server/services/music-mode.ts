import type { IStorage } from "../storage"
import { HueBridgeService } from "./hue-bridge"
import logger from "../lib/logger"

type RoomState = {
  enabled: boolean
  sensitivity: number
  lastBri?: number
  lastCt?: number
  lastAt?: number
  lock?: boolean
}

const key = (roomId:string)=>`music-mode:room:${roomId}`

export class MusicMode {
  private storage: IStorage
  private hue: HueBridgeService
  private rooms = new Map<string, RoomState>()
  private minIntervalMs = 180 // throttle to avoid strobe

  constructor(storage:IStorage, hue:HueBridgeService) {
    this.storage = storage; this.hue = hue
    this.load().catch(()=>undefined)
  }

  private async load() {
    try {
      const all = await this.storage.getAllSettings()
      for (const s of all) {
        if (s.key.startsWith('music-mode:room:')) {
          const roomId = s.key.split(':').pop()!
          this.rooms.set(roomId, { ...(s.value as any) })
        }
      }
    } catch (err) {
      logger.warn('failed to load music mode state', err as any)
    }
  }

  start(roomId: string, sensitivity=1.0) {
    const s = this.rooms.get(roomId) || { enabled:false, sensitivity:1 }
    s.enabled = true
    s.sensitivity = Math.max(0.2, Math.min(3, sensitivity))
    s.lastBri = undefined
    s.lastCt = undefined
    s.lastAt = undefined
    this.rooms.set(roomId, s)
    if (this.storage?.setSetting)
      void this.storage.setSetting(key(roomId), { enabled: s.enabled, sensitivity: s.sensitivity })
    return s
  }

  stop(roomId: string) {
    const s = this.rooms.get(roomId) || { enabled:false, sensitivity:1 }
    s.enabled = false
    s.lastBri = undefined
    s.lastCt = undefined
    s.lastAt = undefined
    this.rooms.set(roomId, s)
    if (this.storage?.setSetting)
      void this.storage.setSetting(key(roomId), { enabled: s.enabled, sensitivity: s.sensitivity })
    return s
  }

  isEnabled(roomId:string){ return !!this.rooms.get(roomId)?.enabled }

  // energy in [0, 1], tempo optional (bpm), will map to bri/ct and set group state
  async telemetry(roomId: string, energy: number, tempo?: number) {
    const s = this.rooms.get(roomId)
    if (!s || !s.enabled || s.lock) return
    const now = Date.now()
    if (s.lastAt && now - s.lastAt < this.minIntervalMs) return
    s.lastAt = now
    s.lock = true

    const e = Math.max(0, Math.min(1, energy * (s.sensitivity || 1)))
    // brightness: 60..254 with ease-out
    const bri = Math.round(60 + 194 * Math.sqrt(e))
    // color temp: cool on peaks, warm on valleys (200..420 mireds)
    const ct = Math.round(420 - 220 * e)

    // smoothing to avoid jumps
    const blend = (prev:number|undefined, next:number, k:number)=> prev===undefined? next : Math.round(prev*(1-k)+next*k)
    const k = 0.35
    const sbri = blend(s.lastBri, bri, k)
    const sct = blend(s.lastCt, ct, k)
    s.lastBri = sbri; s.lastCt = sct

    try {
      const ids = await this.hue.getRoomLightIds(roomId)
      await Promise.all(ids.map((id: string) => this.hue.setLightState(id, { on: true, bri: sbri, ct: sct })))
    } catch (err) {
      logger.warn('Failed to apply state to lights', err as any)
    } finally {
      s.lock = false
    }
  }
}
