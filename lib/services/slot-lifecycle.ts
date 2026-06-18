import type { SlotStatus } from '../constants'
import type { FrictionInput } from '../validations/slot'

export type TransitionError = {
  code: 'INVALID_TRANSITION' | 'FRICTION_REQUIRED' | 'NOTHING_TO_RESUME'
  message: string
}

type TransitionMap = Partial<Record<SlotStatus, SlotStatus[]>>

const ALLOWED_TRANSITIONS: TransitionMap = {
  plan: ['now', 'reprogrammed'],
  now: ['paused', 'done', 'not_done'],
  paused: ['now', 'not_done', 'reprogrammed'],
}

const TRANSITIONS_REQUIRE_FRICTION: Record<string, boolean> = {
  'plan->reprogrammed': true,
  'now->paused': true,
  'now->not_done': true,
  'paused->not_done': true,
  'paused->reprogrammed': true,
}

export function validateTransition(
  from: SlotStatus,
  to: SlotStatus,
  friction?: FrictionInput
): TransitionError | null {
  const allowed = ALLOWED_TRANSITIONS[from]
  if (!allowed || !allowed.includes(to)) {
    return {
      code: 'INVALID_TRANSITION',
      message: `Cannot transition from '${from}' to '${to}'`,
    }
  }

  const key = `${from}->${to}`
  if (TRANSITIONS_REQUIRE_FRICTION[key] && !friction?.friction_reason) {
    return {
      code: 'FRICTION_REQUIRED',
      message: 'This transition requires a friction reason',
    }
  }

  return null
}

export function getAvailableTransitions(status: SlotStatus): SlotStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? []
}

export function isTerminal(status: SlotStatus): boolean {
  return ['done', 'not_done', 'reprogrammed'].includes(status)
}
