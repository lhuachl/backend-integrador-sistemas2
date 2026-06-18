'use client'

import { useState } from 'react'
import { updateSlot, updateSortOrder, type SlotRecord } from '@/lib/services/slots'
import { getAvailableTransitions, isTerminal } from '@/lib/services/slot-lifecycle'
import { getEditableNotes, type NoteField } from '@/lib/services/notes'
import type { SlotStatus } from '@/lib/constants'
import { SlotActions } from './slot-actions'

export function SlotDetail({
  slot,
  onTransition,
  onClose,
  onUpdate,
}: {
  slot: SlotRecord
  onTransition: (to: SlotStatus) => void
  onClose: () => void
  onUpdate: (slot: SlotRecord) => void
}) {
  const [title, setTitle] = useState(slot.title)
  const [duration, setDuration] = useState(slot.duration_planned?.toString() ?? '')
  const [beforeNote, setBeforeNote] = useState(slot.before_note)
  const [afterNote, setAfterNote] = useState(slot.after_note)
  const [saving, setSaving] = useState(false)
  const [noteTab, setNoteTab] = useState<NoteField>('before_note')

  const editableNotes = getEditableNotes(slot)
  const availableTransitions = getAvailableTransitions(slot.status)
  const terminal = isTerminal(slot.status)

  async function handleSave() {
    setSaving(true)
    const { data, error } = await updateSlot(slot.id, {
      title: title !== slot.title ? title : undefined,
      duration_planned: duration ? parseInt(duration, 10) : null,
    })
    if (!error && data) {
      onUpdate(data)
    }
    setSaving(false)
  }

  async function handleSaveNote() {
    setSaving(true)
    const updates: Record<string, string | Record<string, unknown>> = {}
    if (noteTab === 'before_note' && beforeNote !== slot.before_note) {
      updates.before_note = beforeNote
    }
    if (noteTab === 'after_note' && afterNote !== slot.after_note) {
      updates.after_note = afterNote
    }
    if (Object.keys(updates).length === 0) {
      setSaving(false)
      return
    }
    const { data, error } = await updateSlot(slot.id, updates as Partial<SlotRecord>)
    if (!error && data) {
      onUpdate(data)
    }
    setSaving(false)
  }

  const showNoteEditor = editableNotes.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[10px] tracking-wider text-zinc-500 uppercase">
            {slot.status}
          </span>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
              disabled={terminal}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              className="mt-1 w-32 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
              disabled={terminal}
            />
          </div>

          {slot.duration_real !== null && (
            <p className="text-xs text-zinc-600">Actual: {slot.duration_real}m</p>
          )}

          {!terminal && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-indigo-600/80 px-4 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {showNoteEditor && (
          <div className="mt-6">
            <div className="flex gap-1 rounded-lg bg-zinc-900/50 p-1">
              {editableNotes.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setNoteTab(tab)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    noteTab === tab
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'before_note' ? 'Before' : tab === 'during_note' ? 'During' : 'After'}
                </button>
              ))}
            </div>

            <div className="mt-3">
              {noteTab === 'before_note' && (
                <textarea
                  value={beforeNote}
                  onChange={(e) => setBeforeNote(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="What do you intend to do?"
                  className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                />
              )}
              {noteTab === 'after_note' && (
                <textarea
                  value={afterNote}
                  onChange={(e) => setAfterNote(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="How did it go?"
                  className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                />
              )}
              {noteTab === 'during_note' && (
                <p className="text-xs text-zinc-600">Rich text editor coming in a future phase.</p>
              )}
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="mt-2 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700"
              >
                {saving ? 'Saving...' : 'Save note'}
              </button>
            </div>
          </div>
        )}

        {availableTransitions.length > 0 && (
          <div className="mt-6 border-t border-zinc-800/50 pt-4">
            <p className="mb-2 text-[10px] tracking-wider text-zinc-600 uppercase">
              Transition
            </p>
            <SlotActions
              currentStatus={slot.status}
              onTransition={onTransition}
            />
          </div>
        )}
      </div>
    </div>
  )
}
