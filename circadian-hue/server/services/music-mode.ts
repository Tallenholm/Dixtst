import type { IStorage } from "../storage"
import { HueBridgeService } from "./hue-bridge"

type RoomState = {
  enabled: boolean
  sensitivity: number
  lastBri?: number
  lastCt?: number
  lastAt?: number
}

export class MusicMode {
  private storage: IStorage
  private hue: HueBridgeService
  private rooms = new Map<string, RoomState>()
  private minIntervalMs = 180 // throttle to avoid strobe

  constructor(storage:IStorage, hue:HueBridgeService) { this.storage = storage; this.hue = hue }

  start(roomId: string, sensitivity=1.0) {
    const s = this.rooms.get(roomId) || { enabled:false, sensitivity:1 }
    s.enabled = true
    s.sensitivity = Math.max(0.2, Math.min(3, sensitivity))
    this.rooms.set(roomId, s)
    return s
  }

  stop(roomId: string) {
    const s = this.rooms.get(roomId) || { enabled:false, sensitivity:1 }
    s.enabled = false
    this.rooms.set(roomId, s)
    return s
  }

  isEnabled(roomId:string){ return !!this.rooms.get(roomId)?.enabled }

  // energy in [0, 1], tempo optional (bpm), will map to bri/ct and set group state
  async telemetry(roomId: string, energy: number, tempo?: number) {
    const s = this.rooms.get(roomId)
    if (!s || !s.enabled) return
    const now = Date.now()
    if (s.lastAt && now - s.lastAt < this.minIntervalMs) return
    s.lastAt = now

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
      await this.hue.applyStateToAllLights({ on:true, bri: sbri, ct: sct })
    } catch {}
  }
}
