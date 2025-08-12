import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import { storage } from './storage'
import { HueBridgeService } from './services/hue-bridge'
  import { MusicMode } from './services/music-mode'
  import { rollVibe } from './lib/vibe'
  import { Scheduler } from './services/scheduler'
import { getSunTimes, getCurrentPhase } from './lib/sun'
import { listOverrides } from './lib/overrides'
import { DEFAULT_PROFILES } from './lib/profiles'
import { getRoomSchedule, setRoomSchedule } from './lib/schedule'

export async function registerRoutes(app: ReturnType<typeof express>) {
  const server = http.createServer(app)
  const wss = new WebSocketServer({ server })
  const hueBridge = new HueBridgeService(storage)
    const music = new MusicMode(storage, hueBridge)
    const scheduler = new Scheduler()

  wss.on('connection', (ws) => { ws.send(JSON.stringify({ type:'welcome' })) })

  // Core for UI
  app.get('/api/rooms', async (_req,res)=>{ try{ res.json({ rooms: await hueBridge.listRooms() }) } catch(e:any){ res.status(500).json({error:e.message}) } })
  app.get('/api/scenes', async (_req,res)=>{ try{ res.json({ scenes: await hueBridge.listScenes() }) } catch(e:any){ res.status(500).json({error:e.message}) } })
  app.post('/api/rooms/:roomId/scene/apply', async (req,res)=>{ try{ const { roomId }=req.params as any; const sceneId=req.body?.sceneId; if(!sceneId) return res.status(400).json({error:'sceneId required'}); await hueBridge.applySceneToGroup(roomId, sceneId); res.json({ ok:true }) } catch(e:any){ res.status(500).json({error:e.message}) } })

  

// === Vibe Dice ===
app.post('/api/vibe/dice', async (req, res) => {
  try {
    const { roomId, seed, warmth, intensity } = req.body || {}
    const v = rollVibe({ seed, warmth, intensity })
    await hueBridge.applyStateToAllLights({ on:true, bri: v.bri, ct: v.ct })
    res.json({ applied: v })
  } catch (e:any) { res.status(500).json({ error: e.message }) }
})

// === Music Mode (Light DJ) ===
app.post('/api/rooms/:roomId/music/start', async (req, res) => {
  try { const { roomId } = req.params as any; const sens = Number(req.body?.sensitivity ?? 1.0); const s = music.start(roomId, sens); res.json({ ok:true, state:s }) }
  catch (e:any) { res.status(500).json({ error: e.message }) }
})
app.post('/api/rooms/:roomId/music/stop', async (req, res) => {
  try { const { roomId } = req.params as any; const s = music.stop(roomId); res.json({ ok:true, state:s }) }
  catch (e:any) { res.status(500).json({ error: e.message }) }
})
app.post('/api/music/telemetry', async (req, res) => {
  try {
    const { roomId, energy, tempo } = req.body || {}
    if (typeof energy !== 'number' || !roomId) return res.status(400).json({ error: 'roomId and numeric energy required' })
    await music.telemetry(String(roomId), Number(energy), typeof tempo==='number'? tempo: undefined)
    res.json({ ok:true })
  } catch (e:any) { res.status(500).json({ error: e.message }) }
})

// === Sleep Presets ===
app.post('/api/sleep/nightlight', async (req, res) => {
  try { await hueBridge.applyStateToAllLights({ on:true, bri: 30, ct: 430 }); res.json({ ok:true }) }
  catch (e:any) { res.status(500).json({ error: e.message }) }
})
app.post('/api/sleep/winddown', async (req, res) => {
  try {
    const minutes = Math.max(5, Math.min(120, Number(req.body?.minutes ?? 30)))
    const steps = minutes
    let i = 0
    const startBri = 150, endBri = 30
    const startCt = 350, endCt = 430
    const id = 'winddown'
    scheduler.scheduleInterval(id, async ()=>{
      i++
      const t = Math.min(1, i/steps)
      const bri = Math.round(startBri*(1-t) + endBri*t)
      const ct = Math.round(startCt*(1-t) + endCt*t)
      try { await hueBridge.applyStateToAllLights({ on:true, bri, ct }) } catch {}
      if (i>=steps) scheduler.clear(id)
    }, 60*1000)
    res.json({ ok:true, minutes })
  } catch (e:any) { res.status(500).json({ error: e.message }) }
})
app.post('/api/alarm/sunrise', async (req, res) => {
  try {
    const minutes = Math.max(5, Math.min(90, Number(req.body?.minutes ?? 30)))
    let i = 0
    const steps = minutes
    const startBri = 10, endBri = 220
    const startCt = 430, endCt = 250
    const id = 'sunrise'
    scheduler.scheduleInterval(id, async ()=>{
      i++
      const t = Math.min(1, i/steps)
      const bri = Math.round(startBri*(1-t) + endBri*t)
      const ct = Math.round(startCt*(1-t) + endCt*t)
      try { await hueBridge.applyStateToAllLights({ on:true, bri, ct }) } catch {}
      if (i>=steps) scheduler.clear(id)
    }, 60*1000)
    res.json({ ok:true, minutes })
  } catch (e:any) { res.status(500).json({ error: e.message }) }
})
// Sun aliases
  app.get('/api/sun-times', (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
    const t=getSunTimes(lat,lng); res.json(t)
  })
  app.get('/api/current-phase', (req, res) => {
    const lat = parseFloat(String(req.query.lat)); const lng = parseFloat(String(req.query.lng))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
    res.json({ phase: getCurrentPhase(lat,lng) })
  })

  // Pairing (compat)
  app.get('/api/bridges', async (_req, res) => { try { const ips = await hueBridge.discover(); const bridges = ips.map((ip:string, idx:number) => ({ id: ip, ip, name: `Hue Bridge ${idx+1}` })); res.json(bridges) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.post('/api/bridges/discover', async (_req, res) => { try { const ips = await hueBridge.discover(); res.json({ ips }) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.post('/api/bridges/:bridgeId/pair', async (req, res) => { try { const ip = req.params.bridgeId; const r = await hueBridge.pairWithLinkButton(ip); res.json({ paired: true, auth: r }) } catch (e:any) { if (e.message === 'link_button_not_pressed') return res.status(428).json({ error: 'link_button_not_pressed' }); res.status(500).json({ error: e.message }) } })

  // Lights (compat)
  app.get('/api/lights', async (_req, res) => { try { const lights = await hueBridge.refreshLights(); res.json(lights) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.post('/api/rooms', async (_req, res) => { res.json({ ok: true }) })
  app.post('/api/rooms/:roomId/toggle', async (req, res) => { try { const isOn = !!req.body?.isOn; await hueBridge.applyStateToAllLights({ on: isOn }); res.json({ ok: true }) } catch (e:any) { res.status(500).json({ error: e.message }) } })

  // Scenes (compat)
  app.get('/api/scenes/current', async (_req, res) => { res.json({ current: null }) })
  app.post('/api/scenes/apply', async (req, res) => { try { const { sceneId, presetId } = req.body || {}; if (sceneId) { await hueBridge.applySceneToGroup('0', sceneId); return res.json({ ok: true }) } const presets:any={ relax:{bri:90,ct:400}, focus:{bri:200,ct:220}, evening_warm:{bri:120,ct:370}, nightlight:{bri:40,ct:430} }; const st=presets[presetId]||{bri:150,ct:300}; await hueBridge.applyStateToAllLights({ on:true, bri: st.bri, ct: st.ct }); res.json({ ok: true }) } catch (e:any) { res.status(500).json({ error: e.message }) } })

  // System status & location (compat)
  app.get('/api/system/status', async (_req, res) => { res.json({ engine: true, updates: true, schedule: true, lastUpdate: new Date().toISOString() }) })
  app.get('/api/location', async (_req, res) => { try { const loc = await storage.getSetting('location'); res.json(loc?.value || { lat: 41.8781, lng: -87.6298 }) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.post('/api/location/detect', async (_req, res) => { try { const value={ lat:41.8781, lng:-87.6298 }; await storage.setSetting('location', value); res.json({ value }) } catch (e:any) { res.status(500).json({ error: e.message }) } })

  // Schedules (compat shell)
  app.get('/api/schedule/sun-times', async (req, res) => { try { const lat=parseFloat(String(req.query.lat)); const lng=parseFloat(String(req.query.lng)); if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' }); const t=getSunTimes(lat,lng); res.json(t) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.get('/api/schedule/current-phase', async (req, res) => { try { const lat=parseFloat(String(req.query.lat)); const lng=parseFloat(String(req.query.lng)); if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400). json({ error: 'lat and lng required' }); res.json({ phase: getCurrentPhase(lat,lng) }) } catch (e:any) { res.status(500).json({ error: e.message }) } })
  app.get('/api/schedule', async (_req, res) => { res.json({ schedules: [] }) })

  // Effects (compat shell)
  app.post('/api/lights/sleep-mode', async (_req, res) => { try{ await hueBridge.applyStateToAllLights({ on:true, bri:40, ct:430 }); res.json({ ok:true }) } catch(e:any){ res.status(500).json({error:e.message}) } })
  app.post('/api/lights/wake-up', async (_req, res) => { try{ await hueBridge.applyStateToAllLights({ on:true, bri:200, ct:220 }); res.json({ ok:true }) } catch(e:any){ res.status(500).json({error:e.message}) } })
  app.post('/api/effects/start', async (_req, res) => { res.json({ ok: true }) })
  app.post('/api/effects/stop', async (_req, res) => { res.json({ ok: true }) })

  return server
}
