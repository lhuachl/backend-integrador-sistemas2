'use client'

import { useState, useEffect, useRef } from 'react'
import type { SlotRecord } from '@/lib/services/slots'
import type { SlotStatus } from '@/lib/constants'
import BorderGlow from '@/components/BorderGlow'
import { SlotActions } from '@/components/slots/slot-actions'

export function ActiveSlotHero({
  slot,
  onTransition,
}: {
  slot: SlotRecord
  onTransition: (to: SlotStatus) => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const startedRef = useRef<number | null>(null)

  useEffect(() => {
    if (slot.started_at) {
      startedRef.current = new Date(slot.started_at).getTime()
      const tick = () => {
        if (startedRef.current) {
          setElapsed(Math.round((Date.now() - startedRef.current) / 60000))
        }
      }
      tick()
      const interval = setInterval(tick, 10000)
      return () => clearInterval(interval)
    }
  }, [slot.started_at])

  function formatElapsed(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const planned = slot.duration_planned
  const plannedStr = planned ? `${planned}m` : '--'
  const elapsedStr = slot.started_at ? formatElapsed(elapsed) : '--'
  const progress = planned && slot.started_at ? Math.min((elapsed / planned) * 100, 100) : 0

  return (
    <BorderGlow
      glowColor="230 60 70"
      backgroundColor="#09090b"
      borderRadius={16}
      glowRadius={14}
      glowIntensity={0.5}
      className="w-full"
    >
      <div className="relative rounded-2xl border border-zinc-800/60 bg-zinc-950/70 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        <div className="px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-medium tracking-wider text-indigo-400 uppercase">
                Now
              </span>
              <h2 className="mt-1 text-lg font-medium text-zinc-100">{slot.title}</h2>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] tracking-wider text-zinc-600 uppercase">Planned</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-300">{plannedStr}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider text-zinc-600 uppercase">Elapsed</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-300">{elapsedStr}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider text-zinc-600 uppercase">Started</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-300">
                {slot.started_at
                  ? formatTime(slot.started_at)
                  : '--'}
              </p>
            </div>
          </div>

          {planned && slot.started_at && (
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-800/60">
              <div
                className="h-full rounded-full bg-indigo-500/60 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="mt-4">
            <SlotActions
              currentStatus={slot.status}
              onTransition={onTransition}
            />
          </div>
        </div>
      </div>
    </BorderGlow>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
