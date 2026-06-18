import { insforge } from '../insforge'
import type { SlotStatus } from '../constants'
import type { CreateSlotInput, UpdateSlotInput, FrictionInput } from '../validations/slot'
import { validateTransition } from './slot-lifecycle'
import { canEditBeforeNote, canEditDuringNote, canEditAfterNote } from './notes'

export interface SlotRecord {
  id: string
  user_id: string
  date: string
  ritual_id: string | null
  title: string
  duration_planned: number | null
  duration_real: number | null
  status: SlotStatus
  started_at: string | null
  completed_at: string | null
  closed_at: string | null
  friction_reason: string | null
  friction_note: string | null
  before_note: string
  during_note: Record<string, unknown>
  after_note: string
  sort_order: number
  module: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space' | null
  created_at: string
  updated_at: string
}

export type SlotCreate = CreateSlotInput

export type SlotUpdate = UpdateSlotInput

export async function getSlotsByDate(date: string): Promise<{ data: SlotRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('slots')
    .select('*')
    .eq('date', date)
    .order('sort_order', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord[] | null, error: null }
}

export async function getSlotsByModule(
  module: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space'
): Promise<{ data: SlotRecord[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('slots')
    .select('*')
    .eq('module', module)
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord[] | null, error: null }
}

export async function getActiveSlot(): Promise<{ data: SlotRecord | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('slots')
    .select('*')
    .eq('status', 'now')
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord | null, error: null }
}

async function getUserId(): Promise<string | null> {
  const { data } = await insforge.auth.getCurrentUser()
  return data?.user?.id ?? null
}

export async function createSlot(input: CreateSlotInput & { module?: 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space' | null }): Promise<{ data: SlotRecord | null; error: string | null }> {
  const userId = await getUserId()
  if (!userId) return { data: null, error: 'Not authenticated' }

  const { data, error } = await insforge.database
    .from('slots')
    .insert([{
      user_id: userId,
      date: input.date,
      ritual_id: input.ritual_id ?? null,
      title: input.title,
      duration_planned: input.duration_planned ?? null,
      sort_order: input.sort_order ?? 0,
      module: input.module ?? null,
    }])
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord, error: null }
}

export async function updateSlot(
  id: string,
  input: UpdateSlotInput
): Promise<{ data: SlotRecord | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('slots')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord, error: null }
}

export async function transitionSlot(
  id: string,
  to: SlotStatus,
  friction?: FrictionInput
): Promise<{ data: SlotRecord | null; error: string | null }> {
  const { data: current, error: fetchError } = await insforge.database
    .from('slots')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return { data: null, error: fetchError?.message ?? 'Slot not found' }
  }

  const slot = current as SlotRecord
  const validationError = validateTransition(slot.status, to, friction)

  if (validationError) {
    return { data: null, error: validationError.message }
  }

  const updates: Partial<SlotRecord> = {
    status: to,
  }

  const now = new Date().toISOString()

  if (to === 'now') {
    updates.started_at = now
  }

  if (to === 'done') {
    updates.completed_at = now
    updates.closed_at = now
    if (slot.started_at) {
      const started = new Date(slot.started_at).getTime()
      const elapsed = Math.round((Date.now() - started) / 60000)
      updates.duration_real = elapsed
    }
  }

  if (to === 'not_done' || to === 'reprogrammed') {
    updates.closed_at = now
  }

  if (friction) {
    updates.friction_reason = friction.friction_reason
    updates.friction_note = friction.friction_note ?? ''
  }

  if (to === 'paused') {
    updates.friction_reason = friction?.friction_reason ?? null
    updates.friction_note = friction?.friction_note ?? null
  }

  const { data, error } = await insforge.database
    .from('slots')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SlotRecord, error: null }
}

export async function deleteSlot(id: string): Promise<{ error: string | null }> {
  const { error } = await insforge.database
    .from('slots')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function updateSortOrder(
  updates: { id: string; sort_order: number }[]
): Promise<{ error: string | null }> {
  for (const item of updates) {
    const { error } = await insforge.database
      .from('slots')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)

    if (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}
