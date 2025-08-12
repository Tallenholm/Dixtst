import * as React from 'react'
import './gooey-slider.css'

type Props = { min:number, max:number, step?:number, value:number, onChange:(v:number)=>void }
export default function GooeySlider({ min, max, step=1, value, onChange }: Props){
  const trackRef = React.useRef<HTMLDivElement>(null)
  const percent = (value - min) / (max - min)
  const onPointer = (e: React.PointerEvent) => {
    const el = trackRef.current
    if(!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
    const raw = min + (x/rect.width)*(max-min)
    const v = Math.round(raw / step) * step
    onChange(Math.min(max, Math.max(min, v)))
  }
  return (
    <div className="relative py-2 select-none">
      <svg className="gooey-svg">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div ref={trackRef} className="gooey-track" onPointerDown={onPointer} onPointerMove={(e)=>{ if(e.buttons===1) onPointer(e) }}>
        <div className="gooey-thumb" style={{ left: `${percent*100}%` }} />
      </div>
    </div>
  )
}
