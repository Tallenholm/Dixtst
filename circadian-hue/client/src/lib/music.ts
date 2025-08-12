export async function musicStart(roomId: string, sensitivity=1){ 
  const res = await fetch(`/api/rooms/${roomId}/music/start`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sensitivity }) })
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}
export async function musicStop(roomId: string){ 
  const res = await fetch(`/api/rooms/${roomId}/music/stop`, { method:'POST' })
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}
export async function musicTelemetry(roomId: string, energy:number, tempo?:number){
  const res = await fetch(`/api/music/telemetry`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, energy, tempo }) })
  if(!res.ok) throw new Error(await res.text())
  return true
}

// WebAudio energy helper
export async function createEnergyStream(onEnergy:(e:number)=>void){
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(analyser)
  const data = new Uint8Array(analyser.frequencyBinCount)
  let raf = 0
  const loop = ()=>{
    analyser.getByteFrequencyData(data)
    let sum=0, count=0
    // focus on mids (bins 6..64)
    for(let i=6;i<64 && i<data.length;i++){ sum += data[i]; count++ }
    const avg = count? sum / (count*255) : 0
    onEnergy(Math.max(0, Math.min(1, avg)))
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return { stop(){ cancelAnimationFrame(raf); stream.getTracks().forEach(t=>t.stop()); ctx.close() } }
}
