'use client'

import { useState } from 'react'
import type { SlotStatus } from '@/lib/constants'
import { FRICTION_REASONS, FRICTION_REASON_LABELS } from '@/lib/constants'
import type { FrictionInput } from '@/lib/validations/slot'

export function FrictionDialog({
  slotTitle,
  fromStatus,
  toStatus,
  onSubmit,
  onClose,
}: {
  slotTitle: string
  fromStatus: SlotStatus
  toStatus: SlotStatus
  onSubmit: (friction: FrictionInput) => Promise<void>
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setSubmitting(true)
    await onSubmit({ friction_reason: reason as FrictionInput['friction_reason'], friction_note: note })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl">
        <h2 className="text-sm font-medium text-zinc-200">Friction required</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Moving &ldquo;{slotTitle}&rdquo; from{' '}
          <span className="text-zinc-400">{fromStatus}</span> to{' '}
          <span className="text-zinc-400">{toStatus}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Why?</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
              required
            >
              <option value="" disabled>Select a reason</option>
              {FRICTION_REASONS.map((r) => (
                <option key={r} value={r}>{FRICTION_REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What happened?"
              className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-800 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1 rounded-md bg-indigo-600 py-2 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
