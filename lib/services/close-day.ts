import { insforge } from '../insforge'
import { startOfDay, subDays, format } from 'date-fns'
import type { SlotRecord } from './slots'

export interface DayReconciliation {
  date: string
  totalAssigned: number
  totalExecuted: number
  totalNotDone: number
  totalReprogrammed: number
  carryOverSlots: SlotRecord[]
  slotsByStatus: Record<string, SlotRecord[]>
}

export async function getDayReconciliation(date: string): Promise<{ data: DayReconciliation | null; error: string | null }> {
  const { data: slots, error } = await insforge.database
    .from('slots')
    .select('*')
    .eq('date', date)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  if (!slots) return { data: null, error: 'No slots' }

  const list = slots as SlotRecord[]
  const totalAssigned = list.reduce((s, x) => s + (x.duration_planned ?? 60), 0)
  const totalExecuted = list
    .filter((x) => x.status === 'done' || x.status === 'reprogrammed')
    .reduce((s, x) => s + (x.duration_planned ?? x.duration_real ?? 60), 0)
  const totalNotDone = list
    .filter((x) => x.status === 'not_done')
    .reduce((s, x) => s + (x.duration_planned ?? 60), 0)
  const totalReprogrammed = list
    .filter((x) => x.status === 'reprogrammed')
    .reduce((s, x) => s + (x.duration_planned ?? 60), 0)

  const slotsByStatus: Record<string, SlotRecord[]> = {
    plan: list.filter((x) => x.status === 'plan'),
    now: list.filter((x) => x.status === 'now'),
    paused: list.filter((x) => x.status === 'paused'),
    done: list.filter((x) => x.status === 'done'),
    not_done: list.filter((x) => x.status === 'not_done'),
    reprogrammed: list.filter((x) => x.status === 'reprogrammed'),
  }

  const carryOverSlots = list.filter((x) =>
    x.status === 'plan' || x.status === 'paused' || x.status === 'not_done' || x.status === 'now'
  )

  return {
    data: {
      date,
      totalAssigned: Math.round(totalAssigned / 6) / 10,
      totalExecuted: Math.round(totalExecuted / 6) / 10,
      totalNotDone: Math.round(totalNotDone / 6) / 10,
      totalReprogrammed: Math.round(totalReprogrammed / 6) / 10,
      carryOverSlots,
      slotsByStatus,
    },
    error: null,
  }
}

export async function carryOverSlots(
  slotIds: string[],
  targetDate: string
): Promise<{ error: string | null; count: number }> {
  if (slotIds.length === 0) return { error: null, count: 0 }

  const { data, error: fetchError } = await insforge.database
    .from('slots')
    .select('*')
    .in('id', slotIds)

  if (fetchError) return { error: fetchError.message, count: 0 }
  if (!data) return { error: 'No slots found', count: 0 }

  let count = 0
  for (const slot of data as SlotRecord[]) {
    const { error: insertError } = await insforge.database
      .from('slots')
      .insert([{
        user_id: slot.user_id,
        date: targetDate,
        ritual_id: slot.ritual_id,
        title: slot.title,
        duration_planned: slot.duration_planned,
        module: slot.module,
        before_note: slot.before_note,
        sort_order: 999,
        status: 'plan',
      }])

    if (!insertError) count++
  }

  return { error: null, count }
}

export interface WeekStats {
  weekStart: string
  weekEnd: string
  ritualsChecked: number
  ritualsTotal: number
  slotsDone: number
  slotsTotal: number
  moduleCompletion: Record<string, { checked: number; total: number }>
  totalHoursAssigned: number
  totalHoursExecuted: number
}

export async function getWeekStats(weekStart: string): Promise<{ data: WeekStats | null; error: string | null }> {
  const start = startOfDay(new Date(weekStart))
  const end = startOfDay(subDays(start, -7))
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')

  const [slotsResult, ritualsResult, logsResult] = await Promise.all([
    insforge.database.from('slots').select('*').gte('date', startStr).lte('date', endStr),
    insforge.database.from('rituals').select('*').eq('active', true),
    insforge.database.from('ritual_logs').select('*').gte('date', startStr).lte('date', endStr),
  ])

  if (slotsResult.error) return { data: null, error: slotsResult.error.message }
  if (ritualsResult.error) return { data: null, error: ritualsResult.error.message }
  if (logsResult.error) return { data: null, error: logsResult.error.message }

  const slots = (slotsResult.data ?? []) as SlotRecord[]
  const rituals = (ritualsResult.data ?? []) as { id: string; module: string | null }[]
  const logs = (logsResult.data ?? []) as { ritual_id: string; date: string; completed: boolean }[]

  const weekLogs = logs.filter((l) => l.completed)
  const ritualIds = new Set(rituals.map((r) => r.id))
  const checkedLogs = weekLogs.filter((l) => ritualIds.has(l.ritual_id))

  const moduleCompletion: Record<string, { checked: number; total: number }> = {}
  for (const r of rituals) {
    const mod = r.module ?? 'unassigned'
    if (!moduleCompletion[mod]) moduleCompletion[mod] = { checked: 0, total: 0 }
    moduleCompletion[mod].total++
  }
  for (const l of checkedLogs) {
    const r = rituals.find((x) => x.id === l.ritual_id)
    const mod = r?.module ?? 'unassigned'
    if (moduleCompletion[mod]) moduleCompletion[mod].checked++
  }

  const doneSlots = slots.filter((s) => s.status === 'done')
  const totalHoursAssigned = Math.round(slots.reduce((s, x) => s + (x.duration_planned ?? 60), 0) / 6) / 10
  const totalHoursExecuted = Math.round(
    doneSlots.reduce((s, x) => s + (x.duration_planned ?? x.duration_real ?? 60), 0) / 6
  ) / 10

  return {
    data: {
      weekStart: startStr,
      weekEnd: endStr,
      ritualsChecked: checkedLogs.length,
      ritualsTotal: rituals.length * 7,
      slotsDone: doneSlots.length,
      slotsTotal: slots.length,
      moduleCompletion,
      totalHoursAssigned,
      totalHoursExecuted,
    },
    error: null,
  }
}
