'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { AppLayout } from '@/components/layout/app-layout'
import { getJournalEntries, upsertJournalEntry, type MirrorEntry } from '@/lib/services/mirror-journal'
import { getWeekStats, type WeekStats } from '@/lib/services/close-day'
import { MODULES, MODULE_MAP, type ModuleId } from '@/lib/constants/modules'
import BorderGlow from '@/components/BorderGlow'
import { format, startOfWeek, subWeeks } from 'date-fns'
import { TrendingUp, TrendingDown, BookOpen, BarChart3, AlertCircle } from 'lucide-react'

type Tab = 'statement' | 'journal'

export default function MirrorPage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('statement')

  /* Weekly statement state */
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [fetchingStats, setFetchingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  /* Journal state */
  const [entries, setEntries] = useState<MirrorEntry[]>([])
  const [fetchingEntries, setFetchingEntries] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return format(subWeeks(base, weekOffset), 'yyyy-MM-dd')
  }, [weekOffset])

  const loadStats = useCallback(async () => {
    setFetchingStats(true)
    setStatsError(null)
    const { data, error } = await getWeekStats(weekStart)
    if (error) setStatsError(error)
    if (data) setWeekStats(data)
    setFetchingStats(false)
  }, [weekStart])

  const loadEntries = useCallback(async () => {
    const { data, error } = await getJournalEntries()
    if (!error && data) setEntries(data)
    setFetchingEntries(false)
  }, [])

  useEffect(() => {
    if (user) loadStats()
  }, [user, loadStats])

  useEffect(() => {
    if (user) loadEntries()
  }, [user, loadEntries])

  function startNewEntry() {
    setEditDate(format(new Date(), 'yyyy-MM-dd'))
    setEditTitle('')
    setEditContent('')
    setEditing(true)
  }

  function startEdit(entry: MirrorEntry) {
    setEditDate(entry.week_start)
    setEditTitle(entry.title)
    setEditContent(entry.content)
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editContent.trim()) return
    setSaving(true)
    const { data, error } = await upsertJournalEntry(editDate, editTitle, editContent)
    setSaving(false)
    if (!error && data) {
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.week_start !== editDate)
        return [data, ...filtered].sort((a, b) => b.week_start.localeCompare(a.week_start))
      })
      setEditing(false)
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
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
            Mirror
          </h1>
          <div className="flex items-center gap-1 rounded-md border border-zinc-800/50 bg-zinc-900/30 p-0.5">
            <button
              onClick={() => setTab('statement')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] transition-colors ${
                tab === 'statement' ? 'bg-zinc-800/60 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              Statement
            </button>
            <button
              onClick={() => setTab('journal')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] transition-colors ${
                tab === 'journal' ? 'bg-zinc-800/60 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Journal
            </button>
          </div>
        </div>

        {tab === 'statement' && (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-2">
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="rounded-md border border-zinc-800/50 bg-zinc-900/30 px-2.5 py-1 text-[10px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                ← Previous
              </button>
              <div className="text-center">
                <div className="text-[10px] tracking-widest text-zinc-500 uppercase">
                  {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Last week' : `${weekOffset} weeks ago`}
                </div>
                {weekStats && (
                  <div className="text-xs text-zinc-400">
                    {format(new Date(weekStats.weekStart), 'MMM d')} – {format(new Date(weekStats.weekEnd), 'MMM d')}
                  </div>
                )}
              </div>
              <button
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className="rounded-md border border-zinc-800/50 bg-zinc-900/30 px-2.5 py-1 text-[10px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-30"
              >
                Next →
              </button>
            </div>

            {statsError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {fetchingStats ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
              </div>
            ) : weekStats ? (
              <>
                {/* Headline */}
                <BorderGlow
                  glowColor="230 60 70"
                  backgroundColor="#09090b"
                  borderRadius={12}
                  glowRadius={10}
                  glowIntensity={0.4}
                  fillOpacity={0.1}
                  colors={['#6366f1', '#818cf8', '#a5b4fc']}
                  className="w-full"
                >
                  <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/30 px-6 py-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] tracking-widest text-zinc-500 uppercase">
                          Net hours
                        </div>
                        <div className={`mt-1 text-3xl font-mono ${
                          weekStats.totalHoursExecuted >= weekStats.totalHoursAssigned
                            ? 'text-emerald-400/80'
                            : 'text-amber-400/80'
                        }`}>
                          {(weekStats.totalHoursExecuted - weekStats.totalHoursAssigned).toFixed(1)}h
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Assigned</div>
                        <div className="text-lg font-mono text-zinc-300">{weekStats.totalHoursAssigned}h</div>
                        <div className="text-[10px] tracking-widest text-zinc-500 uppercase mt-2">Executed</div>
                        <div className="text-lg font-mono text-zinc-300">{weekStats.totalHoursExecuted}h</div>
                      </div>
                    </div>
                  </div>
                </BorderGlow>

                {/* Module completion */}
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
                    <h2 className="mb-3 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                      Modules
                    </h2>
                    <div className="space-y-2">
                      {Object.entries(weekStats.moduleCompletion).map(([modId, data]) => {
                        const mod = modId !== 'unassigned' ? MODULE_MAP[modId as ModuleId] : null
                        const Icon = mod?.icon ?? BookOpen
                        const pct = data.total > 0 ? Math.round((data.checked / data.total) * 100) : 0
                        return (
                          <div key={modId} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0 text-indigo-400/80" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-300">{mod?.label ?? 'Unassigned'}</span>
                                <span className="font-mono text-zinc-500">{pct}%</span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800/50">
                                <div
                                  className="h-full rounded-full bg-indigo-500/60 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-600">{data.checked}/{data.total}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </BorderGlow>

                {/* Slots summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Slots</div>
                    <div className="mt-1 text-2xl font-mono text-zinc-200">{weekStats.slotsTotal}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Done</div>
                    <div className="mt-1 text-2xl font-mono text-emerald-400/80">{weekStats.slotsDone}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Ritual checks</div>
                    <div className="mt-1 text-2xl font-mono text-zinc-200">{weekStats.ritualsChecked}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/30 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Completion</div>
                    <div className="mt-1 text-2xl font-mono text-indigo-400/80">
                      {weekStats.slotsTotal ? Math.round((weekStats.slotsDone / weekStats.slotsTotal) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {tab === 'journal' && (
          <>
            <div className="flex justify-end">
              {!editing && (
                <button
                  onClick={startNewEntry}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500"
                >
                  New entry
                </button>
              )}
            </div>

            {editing && (
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
                  <form onSubmit={handleSave} className="space-y-3">
                    <div>
                      <label className="text-[10px] tracking-wider text-zinc-600 uppercase">Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-wider text-zinc-600 uppercase">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="How are you?"
                        maxLength={200}
                        className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-wider text-zinc-600 uppercase">Reflection</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="What went well? What could improve? What did you learn?"
                        rows={8}
                        className="mt-1 w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex-1 rounded-md border border-zinc-800 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !editContent.trim()}
                        className="flex-1 rounded-md bg-indigo-600 py-2 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </BorderGlow>
            )}

            {entries.length === 0 && !editing && !fetchingEntries && (
              <p className="py-12 text-center text-xs text-zinc-600">
                No journal entries yet. Start reflecting.
              </p>
            )}

            <div className="space-y-2">
              {entries.map((entry) => (
                <BorderGlow
                  key={entry.id}
                  glowColor="230 60 70"
                  backgroundColor="#09090b"
                  borderRadius={12}
                  glowRadius={6}
                  glowIntensity={0.2}
                  fillOpacity={0.05}
                  className="w-full"
                >
                  <div className="rounded-xl border border-zinc-800/30 bg-zinc-950/20 px-5 py-4 backdrop-blur-sm">
                    <button
                      onClick={() => startEdit(entry)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-600">
                          {format(new Date(entry.week_start), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {entry.title && (
                        <h3 className="mt-1 text-sm font-medium text-zinc-300">{entry.title}</h3>
                      )}
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-3">{entry.content}</p>
                    </button>
                  </div>
                </BorderGlow>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
