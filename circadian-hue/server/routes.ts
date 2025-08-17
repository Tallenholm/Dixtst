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
import { ZodError } from 'zod'

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
    const sceneId = req.body?.sceneId
    if (!sceneId) return res.status(400).json({ error: 'sceneId required' })
    await hueBridge.applySceneToGroup(roomId, sceneId)
    res.json({ ok: true })
  }))

  // Sun aliases
  app.get('/api/sun-times', (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
    const t = getSunTimes(lat, lng)
    res.json(t)
  })
  app.get('/api/current-phase', (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
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
    const loc = await storage.getSetting<{lat:number;lng:number}>('location')
    res.json(loc?.value || { lat: 41.8781, lng: -87.6298 })
  }))
  app.post('/api/location/detect', asyncHandler(async (_req, res) => {
    const value = { lat:41.8781, lng:-87.6298 }
    await storage.setSetting('location', value)
    res.json({ value })
  }))

  // Schedules (compat shell)
  app.get('/api/schedule/sun-times', asyncHandler(async (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
    const t = getSunTimes(lat, lng)
    res.json(t)
  }))
  app.get('/api/schedule/current-phase', asyncHandler(async (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
    res.json({ phase: getCurrentPhase(lat, lng) })
  }))
  app.get('/api/schedule', asyncHandler(async (_req, res) => { res.json({ schedules: [] }) }))

  // Effects (compat shell)
  app.post('/api/lights/sleep-mode', asyncHandler(async (_req, res) => { await hueBridge.applyStateToAllLights({ on:true, bri:40, ct:430 }); res.json({ ok:true }) }))
  app.post('/api/lights/wake-up', asyncHandler(async (_req, res) => { await hueBridge.applyStateToAllLights({ on:true, bri:200, ct:220 }); res.json({ ok:true }) }))
  app.post('/api/effects/start', asyncHandler(async (_req, res) => { res.json({ ok: true }) }))
  app.post('/api/effects/stop', asyncHandler(async (_req, res) => { res.json({ ok: true }) }))

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: err.message })
    console.error(err)
    res.status(500).json({ error: err.message })
  })

  return server
}
