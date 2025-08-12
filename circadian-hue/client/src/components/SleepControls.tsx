import * as React from 'react'
import { Button } from '@/components/ui/button'

export default function SleepControls(){
  const night = async ()=>{ await fetch('/api/sleep/nightlight', { method:'POST' }) }
  const wind = async ()=>{ const mins = prompt('Wind-down minutes', '30'); if(!mins) return; await fetch('/api/sleep/winddown', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ minutes: Number(mins) }) }) }
  const sunrise = async ()=>{ const mins = prompt('Sunrise minutes', '30'); if(!mins) return; await fetch('/api/alarm/sunrise', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ minutes: Number(mins) }) }) }
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={night}>🌙 Nightlight</Button>
      <Button onClick={wind}>🧘 Wind‑down</Button>
      <Button onClick={sunrise}>🌅 Sunrise</Button>
    </div>
  )
}
