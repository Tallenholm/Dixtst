import * as React from 'react'
import { musicStart, musicStop, musicTelemetry, createEnergyStream } from '@/lib/music'
import { Button } from '@/components/ui/button'

export default function MusicControl({ roomId }: { roomId: string }){
  const [running, setRunning] = React.useState(false)
  const [sensitivity, setSensitivity] = React.useState(1)
  const ref = React.useRef<{ stop: ()=>void }|null>(null)

  const start = async ()=>{
    await musicStart(roomId, sensitivity)
    ref.current = await createEnergyStream(async (e)=>{
      try{ await musicTelemetry(roomId, e) } catch {}
    })
    setRunning(true)
  }
  const stop = async ()=>{
    try{ await musicStop(roomId) } catch {}
    ref.current?.stop(); ref.current = null; setRunning(false)
  }

  return (
    <div className="flex items-center gap-2">
      {!running ? <Button onClick={start}>Start Music</Button> : <Button onClick={stop}>Stop Music</Button>}
      <label className="text-xs opacity-70">sens</label>
      <input type="number" min={0.2} max={3} step={0.1} value={sensitivity} onChange={e=>setSensitivity(parseFloat(e.target.value||'1'))}
        className="w-20 border rounded px-2 py-1 text-sm" />
    </div>
  )
}
