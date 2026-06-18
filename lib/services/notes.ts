import type { SlotStatus } from '../constants'

export type NoteField = 'before_note' | 'during_note' | 'after_note'

interface SlotTimestamps {
  status: SlotStatus
  started_at: string | null
  closed_at: string | null
}

export function canEditBeforeNote(slot: SlotTimestamps): boolean {
  if (!slot.started_at) {
    return true
  }

  return false
}

export function canEditDuringNote(slot: SlotTimestamps): boolean {
  return slot.status === 'now' || slot.status === 'paused'
}

export function canEditAfterNote(slot: SlotTimestamps): boolean {
  if (!slot.closed_at) {
    return false
  }

  return true
}

export function getEditableNotes(slot: SlotTimestamps): NoteField[] {
  const editable: NoteField[] = []

  if (canEditBeforeNote(slot)) {
    editable.push('before_note')
  }

  if (canEditDuringNote(slot)) {
    editable.push('during_note')
  }

  if (canEditAfterNote(slot)) {
    editable.push('after_note')
  }

  return editable
}
