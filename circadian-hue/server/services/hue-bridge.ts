import { v3 } from 'node-hue-api'
import fs from 'fs'
import path from 'path'
import type { IStorage, Light } from '../storage'

let colorMap: Record<string, number> | null = null

function loadColorMap(): Record<string, number> {
  if (!colorMap) {
    try {
      const file = path.resolve(__dirname, '../../config/colors.json')
      const json = fs.readFileSync(file, 'utf-8')
      colorMap = JSON.parse(json) as Record<string, number>
    } catch {
      colorMap = {}
    }
  }
  return colorMap
}

function mapColor(name?: string): number {
  const colors = loadColorMap()
  return name && colors[name] !== undefined ? colors[name] : 360
}

export class HueBridgeService {
  private storage: IStorage
  private effectTimer?: NodeJS.Timeout
  private colorCycleTimer?: NodeJS.Timeout
  private previousStates: Record<
    string,
    { on: boolean; bri: number; ct: number }
  > = {}

  constructor(storage: IStorage) {
    this.storage = storage
  }

  private async getApi() {
    const bridge = await this.storage.getSetting<{
      ip: string
      username: string
    }>('bridge')
    if (!bridge) throw new Error('bridge_not_configured')
    return v3.api.createLocal(bridge.value.ip).connect(bridge.value.username)
  }

  async discover(): Promise<string[]> {
    const results = await v3.discovery.nupnpSearch()
    return results.map((b: any) => b.internalipaddress)
  }

  async pairWithLinkButton(
    ip: string,
  ): Promise<{ ip: string; username: string }> {
    const unauth = await v3.api.createLocal(ip).connect()
    try {
      const user = await unauth.users.createUser('circadian-hue#server')
      await this.storage.setSetting('bridge', { ip, username: user.username })
      return { ip, username: user.username }
    } catch (e: any) {
      if (e.getHueErrorType && e.getHueErrorType() === 101) {
        throw new Error('link_button_not_pressed')
      }
      throw e
    }
  }

  async listRooms() {
    const api = await this.getApi()
    const groups = await api.groups.getAll()
    return groups
      .filter((g: any) => ['Room', 'Zone'].includes(g.type))
      .map((g: any) => ({
        id: String(g.id),
        name: g.name,
        type: g.type,
        lights: (g.lights || []).map((l: any) => String(l)),
      }))
  }

  async listScenes() {
    const api = await this.getApi()
    if (!api.scenes) return []
    const scenes = await api.scenes.getAll()
    return scenes.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      groupId: s.group || s.groupid || s.groupId,
    }))
  }

  async applySceneToGroup(roomId: string, sceneId: string) {
    const api = await this.getApi()
    const st = new v3.lightStates.GroupLightState().scene(sceneId)
    await api.groups.setGroupState(roomId, st)
  }

  async getCurrentScene(roomId = '0'): Promise<string | null> {
    const api = await this.getApi()
    try {
      const g = await api.groups.getGroup(roomId)
      const sceneId = g?.state?.scene || g?.action?.scene
      return sceneId ? String(sceneId) : null
    } catch {
      return null
    }
  }

  async getRoomLightIds(roomId: string) {
    const api = await this.getApi()
    const g = await api.groups.getGroup(roomId)
    return (g?.lights || []).map((l: any) => String(l))
  }

  async setLightState(
    id: string,
    state: { on?: boolean; bri?: number; ct?: number },
  ) {
    const api = await this.getApi()
    const st = new v3.lightStates.LightState()
    if (state.on !== undefined) state.on ? st.on() : st.off()
    if (typeof state.bri === 'number')
      st.brightness(Math.max(1, Math.min(254, state.bri)))
    if (typeof state.ct === 'number')
      st.ct(Math.max(153, Math.min(500, state.ct)))
    await api.lights.setLightState(id, st)
  }

  async applyStateToAllLights(state: {
    on?: boolean
    bri?: number
    ct?: number
  }) {
    const api = await this.getApi()
    const st = new v3.lightStates.GroupLightState()
    if (state.on !== undefined) state.on ? st.on() : st.off()
    if (typeof state.bri === 'number')
      st.brightness(Math.max(1, Math.min(254, state.bri)))
    if (typeof state.ct === 'number')
      st.ct(Math.max(153, Math.min(500, state.ct)))
    try {
      await api.groups.setGroupState(0, st)
    } catch {
      const lights = await api.lights.getAll()
      await Promise.all(
        lights.map((l: any) => api.lights.setLightState(l.id, st)),
      )
    }
  }

  async refreshLights(): Promise<Light[]> {
    const api = await this.getApi()
    const lights = await api.lights.getAll()
    return lights.map((l: any) => ({
      id: String(l.id),
      name: l.name,
      isOn: !!l.state.on,
      brightness: l.state.bri ?? 0,
      colorTemp: l.state.ct ?? 0,
      updatedAt: new Date(),
    }))
  }

  async startEffect(
    effectId: string,
    settings: {
      speed?: number
      intensity?: number
      colors?: string[]
      duration?: number
    },
  ) {
    await this.stopEffect()

    const current = await this.refreshLights()
    this.previousStates = {}
    current.forEach((l) => {
      this.previousStates[l.id] = {
        on: l.isOn,
        bri: l.brightness,
        ct: l.colorTemp,
      }
    })

    const intensity = Math.max(0, Math.min(100, settings.intensity ?? 80))
    const bri = Math.round((intensity / 100) * 254)
    const colors =
      settings.colors && settings.colors.length > 0
        ? settings.colors
        : ['white']
    let index = 0

    const applyColor = async (name: string) => {
      const ct = mapColor(name)
      await this.applyStateToAllLights({ on: true, bri, ct })
    }

    await applyColor(colors[index])

    const speed = Math.max(0.1, Math.min(10, settings.speed ?? 5))
    if (colors.length > 1) {
      const interval = 1000 / speed
      this.colorCycleTimer = setInterval(() => {
        index = (index + 1) % colors.length
        applyColor(colors[index]).catch(() => undefined)
      }, interval)
    }

    const duration = Math.max(0, Math.min(3600, settings.duration ?? 0))
    if (duration > 0) {
      this.effectTimer = setTimeout(() => {
        this.stopEffect().catch(() => undefined)
      }, duration * 1000)
    }
  }

  async stopEffect() {
    if (this.effectTimer) {
      clearTimeout(this.effectTimer)
      this.effectTimer = undefined
    }
    if (this.colorCycleTimer) {
      clearInterval(this.colorCycleTimer)
      this.colorCycleTimer = undefined
    }
    if (Object.keys(this.previousStates).length > 0) {
      const api = await this.getApi()
      await Promise.all(
        Object.entries(this.previousStates).map(([id, state]) => {
          const st = new v3.lightStates.LightState()
          state.on ? st.on() : st.off()
          st.brightness(Math.max(1, Math.min(254, state.bri)))
          st.ct(Math.max(153, Math.min(500, state.ct)))
          return api.lights.setLightState(id, st)
        }),
      )
      this.previousStates = {}
    }
  }
}
