'use client'

import { insforge } from '@/lib/insforge'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { AppLayout } from '@/components/layout/app-layout'
import { getRituals, createRitual, deleteRitual, type RitualRecord } from '@/lib/services/rituals'
import { MODULES, MODULE_MAP, type ModuleId } from '@/lib/constants/modules'
import BorderGlow from '@/components/BorderGlow'
import { AlertCircle } from 'lucide-react'

export default function RitualsPage() {
  const { user, loading } = useAuth()
  const [rituals, setRituals] = useState<RitualRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [title, setTitle] = useState('')
  const [ritualType, setRitualType] = useState<'commitment' | 'aspiration'>('aspiration')
  const [ritualModule, setRitualModule] = useState<ModuleId | ''>('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await getRituals()
    if (!error && data) setRituals(data)
    setFetching(false)
  }, [])

  useEffect(() => { load() }, [load])

  const commitments = rituals.filter((r) => r.type === 'commitment')
  const aspirations = rituals.filter((r) => r.type === 'aspiration')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    if (ritualType === 'commitment' && commitments.length >= 3) {
      setError('Max 3 commitments allowed')
      return
    }
    setCreating(true)
    setError(null)
    const { data, error } = await createRitual(
      trimmed,
      ritualType,
      ritualModule ? ritualModule : null
    )
    if (!error && data) {
      setRituals((prev) => [...prev, data])
      setTitle('')
      try { await insforge.realtime.publish('daily-sync', 'rituals-changed', {}) } catch (e) { console.error('[realtime]', e) }
    } else if (error) {
      setError(error)
    }
    setCreating(false)
  }

  async function handleDelete(id: string) {
    const { error } = await deleteRitual(id)
    if (!error) {
      setRituals((prev) => prev.filter((r) => r.id !== id))
      try { await insforge.realtime.publish('daily-sync', 'rituals-changed', {}) } catch (e) { console.error('[realtime]', e) }
    } else {
      setError(error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
      <h1 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
        Rituals
      </h1>

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

      <BorderGlow
        glowColor="230 60 70"
        backgroundColor="#09090b"
        borderRadius={12}
        glowRadius={4}
        glowIntensity={0.08}
        fillOpacity={0.04}
        colors={['#6366f1', '#818cf8', '#a5b4fc']}
        className="w-full"
      >
        <div className="rounded-xl border border-zinc-800/30 bg-zinc-950/30 px-5 py-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New ritual..."
                maxLength={200}
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
              <select
                value={ritualType}
                onChange={(e) => setRitualType(e.target.value as 'commitment' | 'aspiration')}
                className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-xs text-zinc-400 focus:border-indigo-500/50 focus:outline-none"
              >
                <option value="aspiration">Aspiration</option>
                <option value="commitment">Commitment</option>
              </select>
              <button
                type="submit"
                disabled={creating || !title.trim() || (ritualType === 'commitment' && commitments.length >= 3)}
                className="rounded-md bg-indigo-600 px-3 py-2 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {creating ? '...' : 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setRitualModule('')}
                className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                  ritualModule === ''
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                No module
              </button>
              {MODULES.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRitualModule(m.id)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                      ritualModule === m.id
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </form>
        </div>
      </BorderGlow>

      {commitments.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Commitments
            </span>
            <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
              {commitments.length}/3
            </span>
          </div>
          <div className="space-y-1">
            {commitments.map((r) => (
              <RitualCard key={r.id} ritual={r} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {aspirations.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Aspirations
            </span>
            <span className="rounded-full bg-zinc-800/40 px-1.5 py-0.5 text-[10px] text-zinc-600">
              {aspirations.length}
            </span>
          </div>
          <div className="space-y-1">
            {aspirations.map((r) => (
              <RitualCard key={r.id} ritual={r} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {rituals.length === 0 && (
        <p className="py-12 text-center text-xs text-zinc-600">
          No rituals yet. Create a commitment or aspiration.
        </p>
      )}
      </div>
    </AppLayout>
  )
}

function RitualCard({
  ritual,
  onDelete,
}: {
  ritual: RitualRecord
  onDelete: (id: string) => void
}) {
  const mod = ritual.module ? MODULE_MAP[ritual.module as ModuleId] : null
  const Icon = mod?.icon

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-zinc-800/30 hover:bg-zinc-900/20">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          ritual.type === 'commitment' ? 'bg-indigo-500/60' : 'bg-zinc-600/40'
        }`}
      />
      <span className="flex-1 text-sm text-zinc-300">{ritual.title}</span>
      {Icon && <Icon className="h-3 w-3 text-zinc-600" />}
      <span className="text-[10px] tracking-wider text-zinc-600 uppercase">
        {ritual.type}
      </span>
      {ritual.streak_count > 0 && (
        <span className="font-mono text-[11px] text-indigo-400/60">
          {ritual.streak_count}d
        </span>
      )}
      <button
        onClick={() => onDelete(ritual.id)}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
