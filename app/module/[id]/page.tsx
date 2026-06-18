'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { notFound, useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { AppLayout } from '@/components/layout/app-layout'
import { getRitualsByModule, createRitual, checkInRitual, getTodayLogs, deleteRitual, type RitualRecord, type RitualLogRecord } from '@/lib/services/rituals'
import { getSlotsByModule, createSlot, type SlotRecord } from '@/lib/services/slots'
import { MODULE_MAP, MODULES, type ModuleId } from '@/lib/constants/modules'
import BorderGlow from '@/components/BorderGlow'
import { format } from 'date-fns'
import { Plus, X, AlertCircle } from 'lucide-react'

export default function ModulePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as ModuleId
  const mod = MODULE_MAP[id]

  const { user, loading } = useAuth()
  const [rituals, setRituals] = useState<RitualRecord[]>([])
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [todayLogs, setTodayLogs] = useState<RitualLogRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRitual, setNewRitual] = useState('')
  const [newSlot, setNewSlot] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!mod) return
    setError(null)
    const [rResult, sResult, lResult] = await Promise.all([
      getRitualsByModule(id),
      getSlotsByModule(id),
      getTodayLogs(),
    ])
    if (rResult.error) setError(`rituals: ${rResult.error}`)
    if (sResult.error) setError(`slots: ${sResult.error}`)
    if (lResult.error) setError(`logs: ${lResult.error}`)
    if (rResult.data) setRituals(rResult.data)
    if (sResult.data) setSlots(sResult.data)
    if (lResult.data) setTodayLogs(lResult.data)
    setFetching(false)
  }, [id, mod])

  useEffect(() => {
    if (mod) load()
  }, [mod, load])

  if (!mod) {
    notFound()
  }

  if (loading || !user) {
    if (!user) return <AuthPage />
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  const Icon = mod.icon
  const today = format(new Date(), 'yyyy-MM-dd')
  const loggedRitualIds = new Set(todayLogs.filter((l) => l.completed).map((l) => l.ritual_id))
  const checkedCount = rituals.filter((r) => loggedRitualIds.has(r.id)).length
  const todaySlots = slots.filter((s) => s.date === today)
  const doneSlots = todaySlots.filter((s) => s.status === 'done').length

  async function handleAddRitual() {
    const trimmed = newRitual.trim()
    if (!trimmed) return
    setCreating(true)
    const { data, error: err } = await createRitual(trimmed, 'aspiration', id)
    setCreating(false)
    if (err) { setError(`create ritual: ${err}`); return }
    if (data) {
      setRituals((prev) => [...prev, data])
      setNewRitual('')
    }
  }

  async function handleAddSlot() {
    const trimmed = newSlot.trim()
    if (!trimmed) return
    setCreating(true)
    const { data, error: err } = await createSlot({ date: today, title: trimmed, sort_order: todaySlots.length, module: id })
    setCreating(false)
    if (err) { setError(`create slot: ${err}`); return }
    if (data) {
      setSlots((prev) => [data, ...prev])
      setNewSlot('')
    }
  }

  async function handleCheckIn(ritualId: string, completed: boolean) {
    const { data, error: err } = await checkInRitual(ritualId, today, completed)
    if (err) { setError(`checkin: ${err}`); return }
    if (data) {
      setTodayLogs((prev) => {
        const filtered = prev.filter((l) => l.ritual_id !== ritualId)
        return [...filtered, data]
      })
      if (completed) {
        const { data: fresh } = await getRitualsByModule(id)
        if (fresh) setRituals(fresh)
      }
    }
  }

  async function handleDeleteRitual(ritualId: string) {
    const { error: err } = await deleteRitual(ritualId)
    if (err) { setError(`delete: ${err}`); return }
    setRituals((prev) => prev.filter((r) => r.id !== ritualId))
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800/50 bg-zinc-900/30">
            <Icon className="h-5 w-5 text-indigo-400/80" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-light text-zinc-200">{mod.label}</h1>
            <p className="text-xs text-zinc-500">{mod.description}</p>
          </div>
        </div>

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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Rituals</div>
            <div className="mt-1 text-2xl font-light text-zinc-200">{rituals.length}</div>
            <div className="text-[10px] text-zinc-600">{checkedCount} checked today</div>
          </div>
          <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Slots today</div>
            <div className="mt-1 text-2xl font-light text-zinc-200">{todaySlots.length}</div>
            <div className="text-[10px] text-zinc-600">{doneSlots} done</div>
          </div>
          <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Streak avg</div>
            <div className="mt-1 text-2xl font-light text-zinc-200">
              {rituals.length ? Math.round(rituals.reduce((s, r) => s + r.streak_count, 0) / rituals.length) : 0}d
            </div>
            <div className="text-[10px] text-zinc-600">avg across rituals</div>
          </div>
        </div>

        {/* Rituals */}
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
                {mod.label} rituals
              </span>
              <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
                {checkedCount}/{rituals.length}
              </span>
            </div>
            {rituals.length === 0 ? (
              <p className="py-3 text-center text-xs text-zinc-600">No rituals yet</p>
            ) : (
              <ul className="space-y-1">
                {rituals.map((r) => {
                  const checked = loggedRitualIds.has(r.id)
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
                      {r.streak_count > 0 && (
                        <span className="font-mono text-[10px] text-indigo-400/60">
                          {r.streak_count}d
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteRitual(r.id)}
                        className="text-zinc-700 transition-colors hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddRitual() }}
              className="mt-3 flex gap-2 border-t border-zinc-800/20 pt-3"
            >
              <input
                type="text"
                value={newRitual}
                onChange={(e) => setNewRitual(e.target.value)}
                placeholder={`New ${mod.label.toLowerCase()} ritual...`}
                maxLength={200}
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating || !newRitual.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </form>
          </div>
        </BorderGlow>

        {/* Slots */}
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
                {mod.label} slots (last 50)
              </span>
              <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
                {slots.length}
              </span>
            </div>
            {slots.length === 0 ? (
              <p className="py-3 text-center text-xs text-zinc-600">No slots yet</p>
            ) : (
              <ul className="space-y-1">
                {slots.slice(0, 20).map((s) => (
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
                        s.status === 'paused' ? 'bg-amber-400' :
                        'bg-zinc-600'
                      }`}
                    />
                    <span className={`flex-1 text-sm ${s.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {s.title}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-600">{s.date}</span>
                    <span className="text-[10px] text-zinc-600 uppercase">{s.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddSlot() }}
              className="mt-3 flex gap-2 border-t border-zinc-800/20 pt-3"
            >
              <input
                type="text"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder={`New ${mod.label.toLowerCase()} slot for today...`}
                maxLength={200}
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating || !newSlot.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </form>
          </div>
        </BorderGlow>
      </div>
    </AppLayout>
  )
}
