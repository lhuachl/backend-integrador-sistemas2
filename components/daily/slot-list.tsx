'use client'

import type { SlotRecord } from '@/lib/services/slots'
import { SlotCreateForm } from '@/components/kanban/slot-create-form'

export function SlotList({
  slots,
  onCreate,
  onStart,
  onClick,
}: {
  slots: SlotRecord[]
  onCreate: (title: string) => Promise<void>
  onStart: (slot: SlotRecord) => void
  onClick: (slot: SlotRecord) => void
}) {
  return (
    <div className="space-y-1">
      <SlotCreateForm onCreate={onCreate} />

      {slots.length === 0 && (
        <p className="py-6 text-center text-xs text-zinc-600">
          No slots planned yet
        </p>
      )}

      {slots.map((slot) => (
        <div
          key={slot.id}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-zinc-800/50 hover:bg-zinc-900/30"
        >
          <button
            onClick={() => onStart(slot)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-600 transition-colors hover:border-indigo-500 hover:text-indigo-400"
          >
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8">
              <path d="M1.5 0L7 4L1.5 8V0Z" />
            </svg>
          </button>

          <button
            onClick={() => onClick(slot)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span className="flex-1 text-sm text-zinc-300">{slot.title}</span>
            {slot.duration_planned && (
              <span className="font-mono text-[11px] text-zinc-600">{slot.duration_planned}m</span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
