import * as React from 'react'
import { Button } from '@/components/ui/button'

export default function VibeDice({ roomId }: { roomId?: string }){
  const [loading, setLoading] = React.useState(false)
  const [last, setLast] = React.useState<{ bri:number; ct:number; name:string }|null>(null)
  const roll = async ()=>{
    setLoading(true)
    try{
      const res = await fetch('/api/vibe/dice', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId }) })
      const j = await res.json()
      setLast(j.applied)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button onClick={roll} disabled={loading}>{loading? 'Rolling…' : '🎲 Vibe Dice'}</Button>
      {last && <span className="text-xs text-muted-foreground">{last.name} • bri {last.bri} • ct {last.ct}</span>}
    </div>
  )
}
