'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, AlertCircle } from 'lucide-react'
import type { DayReconciliation } from '@/lib/services/close-day'
import { carryOverSlots, getDayReconciliation } from '@/lib/services/close-day'

export function CloseDayDialog({
  date,
  onClose,
  onComplete,
}: {
  date: string
  onClose: () => void
  onComplete: () => void
}) {
  const tomorrow = format(new Date(new Date(date).getTime() + 86400000), 'yyyy-MM-dd')
  const [reconciliation, setReconciliation] = useState<DayReconciliation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCarry, setSelectedCarry] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error: err } = await getDayReconciliation(date)
      setLoading(false)
      if (err) { setError(err); return }
      if (data) {
        setReconciliation(data)
        setSelectedCarry(new Set(data.carryOverSlots.map((s) => s.id)))
      }
    }
    load()
  }, [date])

  async function loadReconciliation() {
    const { data, error: err } = await getDayReconciliation(date)
    setLoading(false)
    if (err) { setError(err); return }
    if (data) {
      setReconciliation(data)
      setSelectedCarry(new Set(data.carryOverSlots.map((s) => s.id)))
    }
  }

  function toggleCarry(id: string) {
    setSelectedCarry((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleClose() {
    setSubmitting(true)
    setError(null)

    if (selectedCarry.size > 0) {
      const { error: carryError } = await carryOverSlots(Array.from(selectedCarry), tomorrow)
      if (carryError) {
        setError(`carry over: ${carryError}`)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-zinc-800/50 bg-zinc-950 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-light text-zinc-200">
          Close day · {format(new Date(date), 'EEE d MMM')}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Reconciliation. Decide what carries over to tomorrow.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
          </div>
        ) : reconciliation ? (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-3 py-2">
                <div className="text-[9px] tracking-widest text-zinc-500 uppercase">Assigned</div>
                <div className="mt-0.5 text-lg font-mono text-zinc-200">{reconciliation.totalAssigned}h</div>
              </div>
              <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-3 py-2">
                <div className="text-[9px] tracking-widest text-zinc-500 uppercase">Executed</div>
                <div className="mt-0.5 text-lg font-mono text-emerald-400/80">{reconciliation.totalExecuted}h</div>
              </div>
              <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-3 py-2">
                <div className="text-[9px] tracking-widest text-zinc-500 uppercase">Not done</div>
                <div className="mt-0.5 text-lg font-mono text-red-400/80">{reconciliation.totalNotDone}h</div>
              </div>
              <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-3 py-2">
                <div className="text-[9px] tracking-widest text-zinc-500 uppercase">Reprogrammed</div>
                <div className="mt-0.5 text-lg font-mono text-amber-400/80">{reconciliation.totalReprogrammed}h</div>
              </div>
            </div>

            {/* Carry over */}
            {reconciliation.carryOverSlots.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Carry over to tomorrow ({selectedCarry.size}/{reconciliation.carryOverSlots.length})
                </h3>
                <ul className="mt-2 space-y-1">
                  {reconciliation.carryOverSlots.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800/20 bg-zinc-900/30 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCarry.has(s.id)}
                        onChange={() => toggleCarry(s.id)}
                        className="h-4 w-4 cursor-pointer accent-indigo-500"
                      />
                      <span className="flex-1 text-sm text-zinc-300">{s.title}</span>
                      <span className="text-[10px] text-zinc-600 uppercase">{s.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Done slots */}
            {reconciliation.slotsByStatus.done.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Done today ({reconciliation.slotsByStatus.done.length})
                </h3>
                <ul className="mt-2 space-y-0.5">
                  {reconciliation.slotsByStatus.done.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800/20 bg-zinc-900/20 px-3 py-1.5"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="flex-1 text-xs text-zinc-500 line-through">{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reconciliation.carryOverSlots.length === 0 && reconciliation.slotsByStatus.done.length === 0 && (
              <p className="text-center text-xs text-zinc-600">No slots today.</p>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-900/30 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleClose}
            disabled={submitting || loading}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Closing...' : 'Close day'}
          </button>
        </div>
      </div>
    </div>
  )
}
