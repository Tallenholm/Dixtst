import * as React from 'react'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/api'

export default function SleepControls(){
  const night = async () => {
    await fetchJson('/api/sleep/nightlight', { method: 'POST' })
  }
  const wind = async () => {
    const mins = prompt('Wind-down minutes', '30');
    if (!mins) return;
    await fetchJson('/api/sleep/winddown', {
      method: 'POST',
      body: { minutes: Number(mins) },
    })
  }
  const sunrise = async () => {
    const mins = prompt('Sunrise minutes', '30');
    if (!mins) return;
    await fetchJson('/api/alarm/sunrise', {
      method: 'POST',
      body: { minutes: Number(mins) },
    })
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={night}>🌙 Nightlight</Button>
      <Button onClick={wind}>🧘 Wind‑down</Button>
      <Button onClick={sunrise}>🌅 Sunrise</Button>
    </div>
  )
}
