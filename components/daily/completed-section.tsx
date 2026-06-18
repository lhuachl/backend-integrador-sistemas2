'use client'

import { useState } from 'react'
import type { SlotRecord } from '@/lib/services/slots'
import { ChevronDown } from 'lucide-react'

type GroupKey = 'done' | 'not_done' | 'reprogrammed'

const GROUP_CONFIG: Record<GroupKey, { label: string; countLabel: string; dot: string }> = {
  done: {
    label: 'Done',
    countLabel: 'done',
    dot: 'bg-emerald-500/60',
  },
  not_done: {
    label: 'Open',
    countLabel: 'open',
    dot: 'bg-red-500/60',
  },
  reprogrammed: {
    label: 'Reprogrammed',
    countLabel: 'reprogrammed',
    dot: 'bg-zinc-600/60',
  },
}

export function CompletedSection({
  slots,
  onClick,
}: {
  slots: SlotRecord[]
  onClick: (slot: SlotRecord) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const groups: Record<GroupKey, SlotRecord[]> = {
    done: slots.filter((s) => s.status === 'done'),
    not_done: slots.filter((s) => s.status === 'not_done'),
    reprogrammed: slots.filter((s) => s.status === 'reprogrammed'),
  }

  const total = slots.length
  if (total === 0) return null

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
          Completed
        </span>
        <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
          {total}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 pl-5">
          {(Object.keys(groups) as GroupKey[]).map((key) => {
            const group = groups[key]
            if (group.length === 0) return null
            const config = GROUP_CONFIG[key]

            return (
              <div key={key}>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  <span className="text-[10px] text-zinc-600">{config.countLabel}</span>
                  <span className="text-[10px] text-zinc-700">{group.length}</span>
                </div>
                {group.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onClick(slot)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-900/30 hover:text-zinc-400 line-through decoration-zinc-700/50"
                  >
                    {slot.title}
                    {slot.duration_real && (
                      <span className="font-mono text-[11px] text-zinc-700">{slot.duration_real}m</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
