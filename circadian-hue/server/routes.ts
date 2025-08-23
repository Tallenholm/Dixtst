// @ts-nocheck
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import { storage } from './storage'
import { HueBridgeService } from './services/hue-bridge'
import { MusicMode } from './services/music-mode'
import { Scheduler } from './services/scheduler'
import { getSunTimes, getCurrentPhase } from './lib/sun'
import { createOverridesRouter } from './routes/overrides'
import { createMusicRouter } from './routes/music'
import { createVibeRouter } from './routes/vibe'
import { createSleepRouter } from './routes/sleep'
import { asyncHandler } from './lib/asyncHandler'
import { z, ZodError } from 'zod'

const LOCATION_DETECT_URL = process.env.IPAPI_ENDPOINT || 'https://ipapi.co/json'
const LOCATION_DETECT_TIMEOUT_MS = 5000

export async function registerRoutes(app: ReturnType<typeof express>) {
  const server = http.createServer(app)
  const wss = new WebSocketServer({ server })
  const hueBridge = new HueBridgeService(storage)
  const music = new MusicMode(storage, hueBridge)
  const scheduler = new Scheduler()

  wss.on('connection', (ws) => { ws.send(JSON.stringify({ type: 'welcome' })) })

  app.use('/api/overrides', createOverridesRouter(storage))
  app.use('/api', createVibeRouter(hueBridge))
  app.use('/api', createMusicRouter(music))
  app.use('/api', createSleepRouter(hueBridge, scheduler))

  // Core for UI
  app.get('/api/rooms', asyncHandler(async (_req, res) => {
    res.json({ rooms: await hueBridge.listRooms() })
  }))
  app.get('/api/scenes', asyncHandler(async (_req, res) => {
    res.json({ scenes: await hueBridge.listScenes() })
  }))
  app.post('/api/rooms/:roomId/scene/apply', asyncHandler(async (req, res) => {
    const { roomId } = req.params as any
    const { sceneId } = z.object({ sceneId: z.string() }).parse(req.body)
    await hueBridge.applySceneToGroup(roomId, sceneId)
    res.json({ ok: true })
  }))

  const coordsSchema = z.object({ lat: z.coerce.number(), lng: z.coerce.number() })

  // Sun aliases
  app.get('/api/sun-times', (req, res) => {
    const { lat, lng } = coordsSchema.parse(req.query)
    const t = getSunTimes(lat, lng)
    res.json(t)
  })
  app.get('/api/current-phase', (req, res) => {
    const { lat, lng } = coordsSchema.parse(req.query)
    res.json({ phase: getCurrentPhase(lat, lng) })
  })

  // Pairing (compat)
  app.get('/api/bridges', asyncHandler(async (_req, res) => {
    const ips = await hueBridge.discover()
    const bridges = ips.map((ip: string, idx: number) => ({ id: ip, ip, name: `Hue Bridge ${idx + 1}` }))
    res.json(bridges)
  }))
  app.post('/api/bridges/discover', asyncHandler(async (_req, res) => {
    const ips = await hueBridge.discover()
    res.json({ ips })
  }))
  app.post('/api/bridges/:bridgeId/pair', asyncHandler(async (req, res) => {
    const ip = req.params.bridgeId
    try {
      const r = await hueBridge.pairWithLinkButton(ip)
      res.json({ paired: true, auth: r })
    } catch (e: any) {
      if (e.message === 'link_button_not_pressed') return res.status(428).json({ error: 'link_button_not_pressed' })
      throw e
    }
  }))

  // Lights (compat)
  app.get('/api/lights', asyncHandler(async (_req, res) => {
    const lights = await hueBridge.refreshLights()
    res.json(lights)
  }))
  app.post('/api/rooms', asyncHandler(async (_req, res) => { res.json({ ok: true }) }))
  app.post('/api/rooms/:roomId/toggle', asyncHandler(async (req, res) => {
    const { roomId } = req.params as any
    const isOn = !!req.body?.isOn
    const ids = await hueBridge.getRoomLightIds(roomId)
    await Promise.all(ids.map((id: string) => hueBridge.setLightState(id, { on: isOn })))
    res.json({ ok: true, ids })
  }))

  // Scenes (compat)
  app.get('/api/scenes/current', asyncHandler(async (_req, res) => { res.json({ current: null }) }))
  app.post('/api/scenes/apply', asyncHandler(async (req, res) => {
    const { sceneId, presetId } = req.body || {}
    if (sceneId) {
      await hueBridge.applySceneToGroup('0', sceneId)
      return res.json({ ok: true })
    }
    const presets: any = { relax:{bri:90,ct:400}, focus:{bri:200,ct:220}, evening_warm:{bri:120,ct:370}, nightlight:{bri:40,ct:430} }
    const st = presets[presetId] || { bri:150, ct:300 }
    await hueBridge.applyStateToAllLights({ on:true, bri: st.bri, ct: st.ct })
    res.json({ ok: true })
  }))

  // System status & location (compat)
  app.get('/api/system/status', asyncHandler(async (_req, res) => { res.json({ engine: true, updates: true, schedule: true, lastUpdate: new Date().toISOString() }) }))
  app.get('/api/location', asyncHandler(async (_req, res) => {
    const loc = await storage.getSetting<{ latitude:number; longitude:number; city?:string; country?:string }>('location')
    if (!loc) return res.status(404).json({ error: 'location_not_set' })
    res.json(loc.value)
  }))
  const locationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    country: z.string().optional(),
  })
  app.post('/api/location', asyncHandler(async (req, res) => {
    const value = locationSchema.parse(req.body || {})
    await storage.setSetting('location', value)
    res.json(value)
  }))
    app.post('/api/location/detect', asyncHandler(async (_req, res) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), LOCATION_DETECT_TIMEOUT_MS)
      try {
        const r = await fetch(LOCATION_DETECT_URL, { signal: controller.signal })
        const data = await r.json()
        const value = { latitude: data.latitude, longitude: data.longitude, city: data.city, country: data.country_name }
        await storage.setSetting('location', value)
        res.json(value)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        res.status(503).json({ error: 'location_service_unavailable', message })
      } finally {
        clearTimeout(timeout)
      }
    }))

  app.get('/api/analytics', asyncHandler(async (_req, res) => {
    const loc = await storage.getSetting<{ latitude:number; longitude:number }>('location')
    let phaseDistribution: { phase:string; hours:number; percentage:number }[] = []
    if (loc) {
      const sun = getSunTimes(loc.value.latitude, loc.value.longitude)
      const sunrise = new Date(sun.sunrise)
      const sunset = new Date(sun.sunset)
      const dayHours = (sunset.getTime() - sunrise.getTime()) / 36e5
      const sunriseHours = 1
      const eveningHours = 1
      const day = Math.max(dayHours - sunriseHours - eveningHours, 0)
      const night = Math.max(24 - day - sunriseHours - eveningHours, 0)
      phaseDistribution = [
        { phase: 'Night', hours: night, percentage: Math.round((night/24)*100) },
        { phase: 'Sunrise', hours: sunriseHours, percentage: Math.round((sunriseHours/24)*100) },
        { phase: 'Day', hours: day, percentage: Math.round((day/24)*100) },
        { phase: 'Evening', hours: eveningHours, percentage: Math.round((eveningHours/24)*100) },
      ]
    }
    res.json({
      todayUsage: { totalHours: 0, circadianHours: 0, manualOverrides: 0, energySaved: 0 },
      weeklyTrends: [],
      phaseDistribution,
      healthMetrics: { circadianScore: 0, sleepScheduleConsistency: 0, lightExposureBalance: 0, wellnessIndex: 0 },
    })
  }))

  // Schedules (compat shell)
  app.get('/api/schedule/sun-times', asyncHandler(async (req, res) => {
    const { lat, lng } = coordsSchema.parse(req.query)
    const t = getSunTimes(lat, lng)
    res.json(t)
  }))
  app.get('/api/schedule/current-phase', asyncHandler(async (req, res) => {
    const { lat, lng } = coordsSchema.parse(req.query)
    res.json({ phase: getCurrentPhase(lat, lng) })
  }))
  app.get('/api/schedule', asyncHandler(async (_req, res) => {
    const sc = await storage.getSetting<any[]>('schedule')
    res.json({ schedules: sc?.value || [] })
  }))
  app.post('/api/schedule', asyncHandler(async (req, res) => {
    const schedules = req.body?.schedules
    if (!Array.isArray(schedules)) return res.status(400).json({ error: 'schedules array required' })
    await storage.setSetting('schedule', schedules)
    res.json({ schedules })
  }))
  app.patch('/api/schedule/:id', asyncHandler(async (req, res) => {
    const id = req.params.id
    const existing = (await storage.getSetting<any[]>('schedule'))?.value || []
    const idx = existing.findIndex((s: any) => s.id === id)
    if (idx === -1) return res.status(404).json({ error: 'schedule_not_found' })
    existing[idx] = { ...existing[idx], ...req.body }
    await storage.setSetting('schedule', existing)
    res.json(existing[idx])
  }))

  // Effects (compat shell)
  app.post('/api/lights/sleep-mode', asyncHandler(async (_req, res) => { await hueBridge.applyStateToAllLights({ on:true, bri:40, ct:430 }); res.json({ ok:true }) }))
  app.post('/api/lights/wake-up', asyncHandler(async (_req, res) => { await hueBridge.applyStateToAllLights({ on:true, bri:200, ct:220 }); res.json({ ok:true }) }))
  app.post('/api/effects/start', asyncHandler(async (req, res) => {
    const { effectId, settings } = req.body || {}
    if (!effectId) return res.status(400).json({ error: 'effectId required' })
    await hueBridge.startEffect(effectId, settings || { speed:5, intensity:80 })
    res.json({ ok: true })
  }))
  app.post('/api/effects/stop', asyncHandler(async (_req, res) => {
    await hueBridge.stopEffect()
    res.json({ ok: true })
  }))

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: err.message })
    console.error(err)
    res.status(500).json({ error: err.message })
  })

  return server
}
