'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { insforge } from '@/lib/insforge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UserSettings({ onClose }: { onClose: () => void }) {
  const { user, setProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const err = await setProfile({ name: name.trim() || undefined })
    if (!err) onClose()
    setSaving(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const key = `${user?.id}/avatar.${ext}`

    const { data, error } = await insforge.storage
      .from('avatars')
      .upload(key, file)

    if (error || !data) {
      setUploading(false)
      return
    }

    const err = await setProfile({ avatar_url: data.url })
    setUploading(false)

    if (err) {
      setPreview(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">Settings</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-16 w-16 overflow-hidden rounded-full bg-zinc-800"
            >
              {preview || user?.avatar_url ? (
                <img
                  src={preview ?? user?.avatar_url ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-500">
                  {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[10px] text-zinc-300">Change</span>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploading && <span className="text-xs text-zinc-500">Uploading...</span>}
            <p className="text-xs text-zinc-600">Click to upload photo (max 2MB)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-name" className="text-xs text-zinc-500">Name</Label>
            <Input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className="border-zinc-800 bg-zinc-900/50 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Email</Label>
            <p className="rounded-md border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-500">
              {user?.email}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-800 text-xs text-zinc-500 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-indigo-600 text-xs text-white hover:bg-indigo-500"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
