'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { getSlotsByDate, createSlot, transitionSlot, deleteSlot, type SlotRecord } from '@/lib/services/slots'
import type { FrictionInput } from '@/lib/validations/slot'
import { ACTIVE_STATUSES, type SlotStatus } from '@/lib/constants'
import { format } from 'date-fns'
import { KanbanColumn } from './kanban-column'
import { SlotCreateForm } from './slot-create-form'
import { FrictionDialog } from '@/components/friction/friction-dialog'
import { SlotDetail } from '@/components/slots/slot-detail'

const COLUMNS: { status: SlotStatus; label: string }[] = [
  { status: 'plan', label: 'Plan' },
  { status: 'now', label: 'Now' },
  { status: 'paused', label: 'Paused' },
  { status: 'done', label: 'Done' },
  { status: 'not_done', label: 'Open' },
]

export function KanbanBoard() {
  const { user, signOut } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingTransition, setPendingTransition] = useState<{
    slot: SlotRecord
    to: SlotStatus
  } | null>(null)
  const [detailSlot, setDetailSlot] = useState<SlotRecord | null>(null)

  const loadSlots = useCallback(async () => {
    const { data, error } = await getSlotsByDate(today)
    if (!error && data) {
      setSlots(data)
    }
    setLoading(false)
  }, [today])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  async function handleCreate(title: string) {
    const { data, error } = await createSlot({
      date: today,
      title,
      sort_order: slots.filter((s) => s.status === 'plan').length,
    })
    if (!error && data) {
      setSlots((prev) => [...prev, data])
    }
  }

  async function handleTransition(slot: SlotRecord, to: SlotStatus) {
    if (to === slot.status) return
    setPendingTransition({ slot, to })
  }

  async function executeTransition(friction?: FrictionInput) {
    if (!pendingTransition) return
    const { slot, to } = pendingTransition
    const { data, error } = await transitionSlot(slot.id, to, friction)
    if (!error && data) {
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? data : s)))
    }
    setPendingTransition(null)
  }

  async function handleDelete(id: string) {
    const { error } = await deleteSlot(id)
    if (!error) {
      setSlots((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const needsFriction = pendingTransition && (
    (pendingTransition.slot.status === 'plan' && pendingTransition.to === 'reprogrammed') ||
    (pendingTransition.slot.status === 'now' && (pendingTransition.to === 'paused' || pendingTransition.to === 'not_done')) ||
    (pendingTransition.slot.status === 'paused' && (pendingTransition.to === 'not_done' || pendingTransition.to === 'reprogrammed'))
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-3">
        <h1 className="text-lg font-light tracking-[0.15em] text-zinc-400 uppercase">
          flowstate
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{user?.name ?? user?.email}</span>
          <button
            onClick={signOut}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {COLUMNS.map((col) => {
          const columnSlots = slots
            .filter((s) => s.status === col.status)
            .sort((a, b) => a.sort_order - b.sort_order)

          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              count={columnSlots.length}
            >
              {col.status === 'plan' && (
                <SlotCreateForm onCreate={handleCreate} />
              )}
              {columnSlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setDetailSlot(slot)}
                  className="group cursor-pointer rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200">{slot.title}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(slot.id)
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <svg className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {slot.duration_planned && (
                    <p className="mt-1 text-xs text-zinc-600">{slot.duration_planned}m</p>
                  )}
                  {slot.friction_reason && (
                    <span className="mt-1.5 inline-block rounded-full bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-400/80">
                      {slot.friction_reason.replace(/_/g, ' ')}
                    </span>
                  )}
                  {ACTIVE_STATUSES.includes(col.status) && (
                    <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {getQuickActions(col.status).map((action) => (
                        <button
                          key={action.to}
                          onClick={() => handleTransition(slot, action.to)}
                          className="flex-1 rounded bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-700/60 hover:text-zinc-200"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </KanbanColumn>
          )
        })}
      </div>

      {needsFriction && pendingTransition && (
        <FrictionDialog
          slotTitle={pendingTransition.slot.title}
          fromStatus={pendingTransition.slot.status}
          toStatus={pendingTransition.to}
          onSubmit={executeTransition}
          onClose={() => setPendingTransition(null)}
        />
      )}

      {detailSlot && (
        <SlotDetail
          slot={detailSlot}
          onTransition={(to) => {
            handleTransition(detailSlot, to)
            setDetailSlot(null)
          }}
          onClose={() => setDetailSlot(null)}
          onUpdate={(updated) => {
            setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
          }}
        />
      )}
    </>
  )
}

function getQuickActions(status: SlotStatus): { to: SlotStatus; label: string }[] {
  switch (status) {
    case 'plan':
      return [
        { to: 'now', label: 'Start' },
        { to: 'reprogrammed', label: 'Reprogram' },
      ]
    case 'now':
      return [
        { to: 'done', label: 'Done' },
        { to: 'paused', label: 'Pause' },
        { to: 'not_done', label: 'Not done' },
      ]
    case 'paused':
      return [
        { to: 'now', label: 'Resume' },
        { to: 'not_done', label: 'Not done' },
        { to: 'reprogrammed', label: 'Reprogram' },
      ]
    default:
      return []
  }
}
