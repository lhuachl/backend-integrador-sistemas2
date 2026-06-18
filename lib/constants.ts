export const SLOT_STATUS = [
  'plan',
  'now',
  'paused',
  'done',
  'not_done',
  'reprogrammed',
] as const

export type SlotStatus = (typeof SLOT_STATUS)[number]

export const FRICTION_REASONS = [
  'priority_changed',
  'low_energy',
  'avoidance',
  'external_interruption',
  'overestimated',
  'no_longer_applies',
] as const

export type FrictionReason = (typeof FRICTION_REASONS)[number]

export const FRICTION_REASON_LABELS: Record<FrictionReason, string> = {
  priority_changed: 'Priority changed',
  low_energy: 'Low energy',
  avoidance: 'Avoidance',
  external_interruption: 'External interruption',
  overestimated: 'Overestimated',
  no_longer_applies: 'No longer applies',
}

export const TERMINAL_STATUSES: SlotStatus[] = ['done', 'not_done', 'reprogrammed']

export const ACTIVE_STATUSES: SlotStatus[] = ['plan', 'now', 'paused']

export const MAX_SLOTS_PER_DAY = 20

export const MAX_ACTIVE_NOW = 1
