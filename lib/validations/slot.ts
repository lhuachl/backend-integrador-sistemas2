import { z } from 'zod'
import { FRICTION_REASONS, SLOT_STATUS } from '../constants'

export const frictionReasonSchema = z.enum(FRICTION_REASONS)

export const slotStatusSchema = z.enum(SLOT_STATUS)

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ritual_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  duration_planned: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().nonnegative().optional(),
})

export type CreateSlotInput = z.infer<typeof createSlotSchema>

export const updateSlotSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  duration_planned: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().nonnegative().optional(),
})

export type UpdateSlotInput = z.infer<typeof updateSlotSchema>

export const frictionSchema = z.object({
  friction_reason: frictionReasonSchema,
  friction_note: z.string().max(500).optional().default(''),
})

export type FrictionInput = z.infer<typeof frictionSchema>

export const transitionSchema = z.object({
  from: slotStatusSchema,
  to: slotStatusSchema,
  friction: frictionSchema.optional(),
})

export type TransitionInput = z.infer<typeof transitionSchema>

export const beforeNoteSchema = z.string().max(2000)

export const duringNoteSchema = z.object({}).catchall(z.unknown())

export const afterNoteSchema = z.string().max(2000)
