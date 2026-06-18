import { insforge } from '../insforge'
import { startOfDay, subDays, differenceInCalendarDays, isBefore, parseISO } from 'date-fns'

export interface RitualRecord {
  id: string
  user_id: string
  title: string
  type: 'commitment' | 'aspiration'
  active: boolean
  streak_count: number
  last_completed: string | null
  module: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space' | null
  created_at: string
  updated_at: string
}

export interface RitualLogRecord {
  id: string
  user_id: string
  ritual_id: string
  date: string
  completed: boolean
  note: string | null
  created_at: string
}

async function getUserId(): Promise<string | null> {
  const { data } = await insforge.auth.getCurrentUser()
  return data?.user?.id ?? null
}

export async function getRituals(): Promise<{ data: RitualRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('rituals')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as RitualRecord[] | null, error: null }
}

export async function getRitualsByModule(
  module: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space'
): Promise<{ data: RitualRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('rituals')
    .select('*')
    .eq('active', true)
    .eq('module', module)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as RitualRecord[] | null, error: null }
}

export async function getAllRituals(): Promise<{ data: RitualRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('rituals')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as RitualRecord[] | null, error: null }
}

export async function createRitual(
  title: string,
  type: 'commitment' | 'aspiration',
  module?: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space' | null
): Promise<{ data: RitualRecord | null; error: string | null }> {
  const userId = await getUserId()
  if (!userId) return { data: null, error: 'Not authenticated' }

  const { data, error } = await insforge.database
    .from('rituals')
    .insert([{ user_id: userId, title, type, streak_count: 0, module: module ?? null }])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RitualRecord, error: null }
}

export async function updateRitual(
  id: string,
  updates: Partial<Pick<RitualRecord, 'title' | 'type' | 'active'>>
): Promise<{ data: RitualRecord | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('rituals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RitualRecord, error: null }
}

export async function deleteRitual(id: string): Promise<{ error: string | null }> {
  const { error } = await insforge.database
    .from('rituals')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function checkInRitual(
  ritualId: string,
  date: string,
  completed: boolean,
  note?: string
): Promise<{ data: RitualLogRecord | null; error: string | null }> {
  const userId = await getUserId()
  if (!userId) return { data: null, error: 'Not authenticated' }

  const { data: existing, error: fetchError } = await insforge.database
    .from('ritual_logs')
    .select('*')
    .eq('ritual_id', ritualId)
    .eq('date', date)
    .maybeSingle()

  if (fetchError) return { data: null, error: fetchError.message }

  let logData: RitualLogRecord | null = null

  if (existing) {
    const { data, error } = await insforge.database
      .from('ritual_logs')
      .update({ completed, note: note ?? null })
      .eq('id', (existing as RitualLogRecord).id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    logData = data as RitualLogRecord
  } else {
    const { data, error } = await insforge.database
      .from('ritual_logs')
      .insert([{ user_id: userId, ritual_id: ritualId, date, completed, note: note ?? null }])
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    logData = data as RitualLogRecord
  }

  if (completed) {
    await recalculateStreak(ritualId)
  }

  return { data: logData, error: null }
}

export async function getTodayLogs(): Promise<{ data: RitualLogRecord[] | null; error: string | null }> {
  const today = startOfDay(new Date()).toISOString().split('T')[0]
  const { data, error } = await insforge.database
    .from('ritual_logs')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as RitualLogRecord[] | null, error: null }
}

export async function getLogsForDate(date: string): Promise<{ data: RitualLogRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('ritual_logs')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as RitualLogRecord[] | null, error: null }
}

async function recalculateStreak(ritualId: string): Promise<void> {
  const { data: logs, error } = await insforge.database
    .from('ritual_logs')
    .select('date')
    .eq('ritual_id', ritualId)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(365)

  if (error || !logs || logs.length === 0) {
    await updateRitualStreak(ritualId, 0, null)
    return
  }

  const dates: string[] = (logs as { date: string }[]).map((l) => l.date).sort().reverse()
  const today = startOfDay(new Date()).toISOString().split('T')[0]

  if (dates[0] !== today && dates[0] !== startOfDay(subDays(new Date(), 1)).toISOString().split('T')[0]) {
    await updateRitualStreak(ritualId, 0, null)
    return
  }

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const expected = subDays(parseISO(dates[i - 1]), 1).toISOString().split('T')[0]
    if (dates[i] === expected) {
      streak++
    } else {
      break
    }
  }

  await updateRitualStreak(ritualId, streak, dates[0])
}

async function updateRitualStreak(
  ritualId: string,
  streak: number,
  lastDate: string | null
): Promise<void> {
  await insforge.database
    .from('rituals')
    .update({ streak_count: streak, last_completed: lastDate })
    .eq('id', ritualId)
}
