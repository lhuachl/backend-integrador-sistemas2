'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Zap, Brain, Briefcase, Heart, Wallet, Home, RefreshCw, AlertCircle, Moon } from 'lucide-react'
import { getSlotsByDate, createSlot, transitionSlot, deleteSlot, type SlotRecord } from '@/lib/services/slots'
import type { FrictionInput } from '@/lib/validations/slot'
import type { SlotStatus } from '@/lib/constants'
import { getRituals, createRitual, checkInRitual, getTodayLogs, deleteRitual, type RitualRecord, type RitualLogRecord } from '@/lib/services/rituals'
import { ActiveSlotHero } from './active-slot-hero'
import { SlotList } from './slot-list'
import { CompletedSection } from './completed-section'
import { FrictionDialog } from '@/components/friction/friction-dialog'
import { SlotDetail } from '@/components/slots/slot-detail'
import { CloseDayDialog } from '@/components/close/close-day-dialog'
import BorderGlow from '@/components/BorderGlow'

const MODULES = [
  { id: 'body', icon: 'zap', label: 'Body', defaultRitual: 'Movimiento diario', keywords: ['gym', 'movimiento', 'workout', 'run', 'yoga', 'exercis', 'entren', 'correr'] },
  { id: 'mind', icon: 'brain', label: 'Mind', defaultRitual: 'Lectura nocturna', keywords: ['read', 'lectura', 'learn', 'journal', 'medit', 'study'] },
  { id: 'work', icon: 'briefcase', label: 'Work', defaultRitual: 'Deep Work', keywords: ['deep work', 'proyect', 'trabajo', 'coding', 'project'] },
  { id: 'relate', icon: 'heart', label: 'Relate', defaultRitual: 'Conexión diaria', keywords: ['family', 'familia', 'connect', 'friend', 'llamar'] },
  { id: 'wealth', icon: 'wallet', label: 'Wealth', defaultRitual: 'Revisión semanal', keywords: ['finance', 'finanzas', 'budget', 'ahorro', 'gasto', 'invest'] },
  { id: 'space', icon: 'home', label: 'Space', defaultRitual: 'Orden', keywords: ['clean', 'orden', 'hogar', 'organiz', 'declutter'] },
] as const

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  brain: Brain,
  briefcase: Briefcase,
  heart: Heart,
  wallet: Wallet,
  home: Home,
}

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon className={className} /> : null
}

function findModule(ritualTitle: string): (typeof MODULES)[number] | undefined {
  const lower = ritualTitle.toLowerCase()
  for (const m of MODULES) {
    for (const kw of m.keywords) {
      if (lower.includes(kw)) {
        return m
      }
    }
  }
  return undefined
}

export function DailyPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const dayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingTransition, setPendingTransition] = useState<{
    slot: SlotRecord
    to: SlotStatus
  } | null>(null)
  const [detailSlot, setDetailSlot] = useState<SlotRecord | null>(null)
  const [rituals, setRituals] = useState<RitualRecord[]>([])
  const [todayLogs, setTodayLogs] = useState<RitualLogRecord[]>([])
  const [newRitualTitle, setNewRitualTitle] = useState('')
  const [newRitualModule, setNewRitualModule] = useState<string>('')
  const [creatingRitual, setCreatingRitual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCloseDay, setShowCloseDay] = useState(false)

  const loadSlots = useCallback(async () => {
    setError(null)
    const [slotsResult, ritualsResult, logsResult] = await Promise.all([
      getSlotsByDate(today),
      getRituals(),
      getTodayLogs(),
    ])

    if (slotsResult.error) setError(`slots: ${slotsResult.error}`)
    if (ritualsResult.error) setError(`rituals: ${ritualsResult.error}`)
    if (logsResult.error) setError(`logs: ${logsResult.error}`)

    if (slotsResult.data) setSlots(slotsResult.data)
    if (ritualsResult.data) setRituals(ritualsResult.data)
    if (logsResult.data) setTodayLogs(logsResult.data)
    setLoading(false)
  }, [today])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const nowSlot = slots.find((s) => s.status === 'now')
  const plannedSlots = slots
    .filter((s) => s.status === 'plan')
    .sort((a, b) => a.sort_order - b.sort_order)
  const terminalSlots = slots.filter((s) =>
    ['done', 'not_done', 'reprogrammed'].includes(s.status)
  )

  /* ----- LifeOS: balance ----- */
  const assignedMinutes = useMemo(() => {
    const active = [nowSlot, ...plannedSlots].filter(Boolean) as SlotRecord[]
    return active.reduce((sum, s) => sum + (s.duration_planned ?? 60), 0)
  }, [nowSlot, plannedSlots])

  const availHours = 16
  const assignedHours = Math.round(assignedMinutes / 6) / 10
  const freeHours = Math.max(0, Math.round((availHours * 60 - assignedMinutes) / 6) / 10)

  /* ----- LifeOS: modules with ritual status ----- */
  const loggedRitualIds = new Set(todayLogs.filter((l) => l.completed).map((l) => l.ritual_id))

  const moduleStates = useMemo(() => {
    const ritualByModule = new Map<string, { ritual: RitualRecord; checked: boolean }>()
    for (const r of rituals) {
      let modId: string | null = null
      if (r.module) {
        modId = r.module
      } else {
        const matched = findModule(r.title)
        if (matched) modId = matched.id
      }
      if (modId) {
        ritualByModule.set(modId, { ritual: r, checked: loggedRitualIds.has(r.id) })
      }
    }
    return MODULES.map((m) => ({
      ...m,
      matched: ritualByModule.get(m.id) ?? null,
    }))
  }, [rituals, loggedRitualIds])

  const activeModules = moduleStates.filter((m) => m.matched)

  /* ----- handlers ----- */
  async function handleCreate(title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    const { data, error: err } = await createSlot({
      date: today,
      title: trimmed,
      sort_order: plannedSlots.length,
    })
    if (err) {
      setError(`create slot: ${err}`)
      console.error('[createSlot]', err)
      return
    }
    if (data) setSlots((prev) => [...prev, data])
  }

  async function handleTransition(slot: SlotRecord, to: SlotStatus) {
    if (to === slot.status) return

    const needsFriction =
      (slot.status === 'plan' && to === 'reprogrammed') ||
      (slot.status === 'now' && (to === 'paused' || to === 'not_done')) ||
      (slot.status === 'paused' && (to === 'not_done' || to === 'reprogrammed'))

    if (needsFriction) {
      setPendingTransition({ slot, to })
      return
    }

    await executeTransition(slot.id, to)
  }

  async function executeTransition(id: string, to: SlotStatus, friction?: FrictionInput) {
    const { data, error: err } = await transitionSlot(id, to, friction)
    if (err) {
      setError(`transition: ${err}`)
      console.error('[transitionSlot]', err)
      return
    }
    if (data) setSlots((prev) => prev.map((s) => (s.id === id ? data : s)))
    setPendingTransition(null)
  }

  async function handleDelete(id: string) {
    const { error: err } = await deleteSlot(id)
    if (err) {
      setError(`delete: ${err}`)
      return
    }
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleCheckIn(ritualId: string, completed: boolean) {
    const { data, error: err } = await checkInRitual(ritualId, today, completed)
    if (err) {
      setError(`checkin: ${err}`)
      console.error('[checkInRitual]', err)
      return
    }
    if (data) {
      setTodayLogs((prev) => {
        const filtered = prev.filter((l) => l.ritual_id !== ritualId)
        return [...filtered, data]
      })
      if (completed) {
        const { data: freshRituals } = await getRituals()
        if (freshRituals) setRituals(freshRituals)
      }
    }
  }

  async function handleCreateRitual(title: string, module?: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    setCreatingRitual(true)
    const { data, error: err } = await createRitual(trimmed, 'aspiration', (module ?? null) as 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space' | null)
    setCreatingRitual(false)
    if (err) {
      setError(`create ritual: ${err}`)
      console.error('[createRitual]', err)
      return
    }
    if (data) {
      setRituals((prev) => [...prev, data])
      setNewRitualTitle('')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
          {dayLabel}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCloseDay(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800/50 bg-zinc-900/30 px-2.5 py-1.5 text-[10px] text-zinc-500 transition-colors hover:border-indigo-500/50 hover:text-indigo-300"
          >
            <Moon className="h-3 w-3" />
            Close day
          </button>
          <button
            onClick={loadSlots}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800/50 bg-zinc-900/30 px-2.5 py-1.5 text-[10px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Error</div>
            <div className="text-red-400/80">{error}</div>
          </div>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300">×</button>
        </div>
      )}

      {/* LifeOS: Balance bar */}
      <div className="flex items-center gap-6 rounded-lg border border-zinc-800/20 bg-zinc-900/30 px-5 py-3">
        <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
          Balance
        </span>
        <div className="flex gap-4 text-xs">
          <span className="text-zinc-400">
            <span className="text-zinc-600">{availHours}h</span> disponibles
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">
            <span className="text-indigo-400/80">{assignedHours}h</span> asignadas
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">
            <span className={freeHours > 0 ? 'text-emerald-400/80' : 'text-red-400/80'}>{freeHours}h</span> libres
          </span>
        </div>
      </div>

      {/* Active slot */}
      {nowSlot && (
        <ActiveSlotHero
          slot={nowSlot}
          onTransition={(to) => handleTransition(nowSlot, to)}
        />
      )}

      {/* Plan section */}
      <BorderGlow
        glowColor="230 60 70"
        backgroundColor="#09090b"
        borderRadius={12}
        glowRadius={8}
        glowIntensity={0.3}
        fillOpacity={0.08}
        colors={['#6366f1', '#818cf8', '#a5b4fc']}
        className="w-full"
      >
        <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/30 px-5 py-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Plan
            </span>
            <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
              {plannedSlots.length}
            </span>
          </div>
          <SlotList
            slots={plannedSlots}
            onCreate={handleCreate}
            onStart={(slot) => handleTransition(slot, 'now')}
            onClick={(slot) => setDetailSlot(slot)}
          />
        </div>
      </BorderGlow>

      {/* Done section */}
      <BorderGlow
        glowColor="230 60 70"
        backgroundColor="#09090b"
        borderRadius={12}
        glowRadius={8}
        glowIntensity={0.25}
        fillOpacity={0.06}
        colors={['#6366f1', '#818cf8', '#a5b4fc']}
        className="w-full"
      >
        <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/30 px-5 py-4 backdrop-blur-sm">
          <CompletedSection
            slots={terminalSlots}
            onClick={(slot) => setDetailSlot(slot)}
          />
        </div>
      </BorderGlow>

      {/* LifeOS: Module cards */}
      {activeModules.length > 0 && (
        <div>
          <h2 className="mb-3 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
            Modules active
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activeModules.map((mod) => {
              const checked = mod.matched?.checked ?? false
              const ritual = mod.matched?.ritual
              return (
                <BorderGlow
                  key={mod.id}
                  glowColor="230 60 70"
                  backgroundColor="#09090b"
                  borderRadius={10}
                  glowRadius={6}
                  glowIntensity={0.2}
                  fillOpacity={0.04}
                  colors={['#6366f1', '#818cf8', '#a5b4fc']}
                  className="w-full"
                >
                  <div className="rounded-lg border border-zinc-800/30 bg-zinc-950/30 px-4 py-3 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <ModuleIcon name={mod.icon} className="h-4 w-4 text-indigo-400/80" />
                      <span className="text-xs tracking-wide text-zinc-400">{mod.label}</span>
                    </div>
                    {ritual && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full border p-0.5 ${
                            checked
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                              : 'border-zinc-700 text-transparent'
                          }`}
                        >
                          {checked && (
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`truncate text-xs ${checked ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                          {ritual.title}
                        </span>
                        {ritual.streak_count > 0 && checked && (
                          <span className="font-mono text-[9px] text-indigo-400/50">{ritual.streak_count}d</span>
                        )}
                      </div>
                    )}
                  </div>
                </BorderGlow>
              )
            })}
          </div>
        </div>
      )}

      {/* Rituals list */}
      <BorderGlow
        glowColor="230 60 70"
        backgroundColor="#09090b"
        borderRadius={12}
        glowRadius={8}
        glowIntensity={0.25}
        fillOpacity={0.06}
        colors={['#6366f1', '#818cf8', '#a5b4fc']}
        className="w-full"
      >
        <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/30 px-5 py-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Rituals
            </span>
            <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
              {todayLogs.filter((l) => l.completed).length}/{rituals.length}
            </span>
          </div>
          {rituals.length === 0 && (
            <p className="py-4 text-center text-xs text-zinc-600">
              No rituals yet. Create one below.
            </p>
          )}
          <ul className="space-y-1">
            {rituals.map((r) => {
              const checked = loggedRitualIds.has(r.id)
              const mod = findModule(r.title)
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/20 bg-zinc-900/20 px-3 py-2.5"
                >
                  <button
                    onClick={() => handleCheckIn(r.id, !checked)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      checked
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                        : 'border-zinc-700 text-zinc-600 hover:border-indigo-500 hover:text-indigo-400'
                    }`}
                  >
                    {checked && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${checked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    {r.title}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {mod ? <ModuleIcon name={mod.icon} className="inline h-3 w-3" /> : <Zap className="inline h-3 w-3" />}
                  </span>
                  {r.streak_count > 0 && checked && (
                    <span className="font-mono text-[10px] text-indigo-400/60">
                      {r.streak_count}d
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      const { error: err } = await deleteRitual(r.id)
                      if (err) setError(`delete ritual: ${err}`)
                      else setRituals((prev) => prev.filter((x) => x.id !== r.id))
                    }}
                    className="text-zinc-700 transition-colors hover:text-red-400"
                    title="Delete ritual"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newRitualTitle.trim()) {
                handleCreateRitual(newRitualTitle, newRitualModule || undefined)
              }
            }}
            className="mt-3 flex flex-col gap-2 border-t border-zinc-800/20 pt-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newRitualTitle}
                onChange={(e) => setNewRitualTitle(e.target.value)}
                placeholder="New ritual (e.g. levantarse 6am)..."
                maxLength={200}
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creatingRitual || !newRitualTitle.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {creatingRitual ? '...' : 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setNewRitualModule('')}
                className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                  newRitualModule === ''
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                Auto
              </button>
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setNewRitualModule(m.id)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                    newRitualModule === m.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </form>
        </div>
      </BorderGlow>

      {/* Slots list (todos) */}
      {slots.length > 0 && (
        <BorderGlow
          glowColor="230 60 70"
          backgroundColor="#09090b"
          borderRadius={12}
          glowRadius={8}
          glowIntensity={0.2}
          fillOpacity={0.04}
          colors={['#6366f1', '#818cf8', '#a5b4fc']}
          className="w-full"
        >
          <div className="rounded-xl border border-zinc-800/30 bg-zinc-950/30 px-5 py-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                All slots today
              </span>
              <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
                {slots.length}
              </span>
            </div>
            <ul className="space-y-1">
              {slots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/20 bg-zinc-900/20 px-3 py-2"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      s.status === 'now' ? 'bg-indigo-500' :
                      s.status === 'done' ? 'bg-emerald-500' :
                      s.status === 'not_done' ? 'bg-red-500' :
                      s.status === 'reprogrammed' ? 'bg-amber-500' :
                      'bg-zinc-600'
                    }`}
                  />
                  <span className={`flex-1 text-sm ${s.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    {s.title}
                  </span>
                  <span className="text-[10px] text-zinc-600 uppercase">{s.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </BorderGlow>
      )}

      {/* Dialogs */}
      {pendingTransition && (
        <FrictionDialog
          slotTitle={pendingTransition.slot.title}
          fromStatus={pendingTransition.slot.status}
          toStatus={pendingTransition.to}
          onSubmit={(friction) =>
            executeTransition(pendingTransition.slot.id, pendingTransition.to, friction)
          }
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

      {showCloseDay && (
        <CloseDayDialog
          date={today}
          onClose={() => setShowCloseDay(false)}
          onComplete={() => {
            setShowCloseDay(false)
            loadSlots()
          }}
        />
      )}
    </div>
  )
}
