'use client'

import type { ReactNode } from 'react'
import type { SlotStatus } from '@/lib/constants'

const COLUMN_ACCENTS: Record<SlotStatus, string> = {
  plan: 'border-t-zinc-700',
  now: 'border-t-indigo-500',
  paused: 'border-t-amber-500',
  done: 'border-t-emerald-500',
  not_done: 'border-t-red-500',
  reprogrammed: 'border-t-zinc-600',
}

export function KanbanColumn({
  status,
  label,
  count,
  children,
}: {
  status: SlotStatus
  label: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={`mb-3 flex items-center justify-between border-t-2 pt-2 ${COLUMN_ACCENTS[status]}`}>
        <span className="text-xs font-medium tracking-wider text-zinc-400 uppercase">{label}</span>
        <span className="rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
