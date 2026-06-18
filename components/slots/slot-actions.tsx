'use client'

import type { SlotStatus } from '@/lib/constants'
import { getAvailableTransitions } from '@/lib/services/slot-lifecycle'

const TRANSITION_LABELS: Partial<Record<SlotStatus, string>> = {
  now: 'Start',
  done: 'Done',
  paused: 'Pause',
  not_done: 'Not done',
  reprogrammed: 'Reprogram',
}

const TRANSITION_COLORS: Partial<Record<SlotStatus, string>> = {
  now: 'bg-indigo-600/80 hover:bg-indigo-500 text-white',
  done: 'bg-emerald-600/80 hover:bg-emerald-500 text-white',
  paused: 'bg-amber-600/80 hover:bg-amber-500 text-white',
  not_done: 'bg-red-600/80 hover:bg-red-500 text-white',
  reprogrammed: 'bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300',
}

export function SlotActions({
  currentStatus,
  onTransition,
}: {
  currentStatus: SlotStatus
  onTransition: (to: SlotStatus) => void
}) {
  const transitions = getAvailableTransitions(currentStatus)

  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {transitions.map((to) => (
        <button
          key={to}
          onClick={() => onTransition(to)}
          className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
            TRANSITION_COLORS[to] ?? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {TRANSITION_LABELS[to] ?? to}
        </button>
      ))}
    </div>
  )
}
