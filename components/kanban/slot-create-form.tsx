'use client'

import { useState } from 'react'

export function SlotCreateForm({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await onCreate(trimmed)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add slot..."
        maxLength={200}
        className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/30 px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="rounded-md bg-indigo-600/80 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
      >
        Add
      </button>
    </form>
  )
}
