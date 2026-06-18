'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { AppLayout } from '@/components/layout/app-layout'
import { insforge } from '@/lib/insforge'
import BorderGlow from '@/components/BorderGlow'

export default function SettingsPage() {
  const { user, setProfile, loading } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const err = await setProfile({ name: name.trim() || undefined })
    setSaving(false)
    if (!err) setName(name.trim())
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

    await setProfile({ avatar_url: data.url })
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
      <h1 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
        Settings
      </h1>

      <BorderGlow
        glowColor="230 60 70"
        backgroundColor="#09090b"
        borderRadius={16}
        glowRadius={6}
        glowIntensity={0.1}
        fillOpacity={0.04}
        colors={['#6366f1', '#818cf8', '#a5b4fc']}
        className="w-full"
      >
        <div className="rounded-2xl border border-zinc-800/40 bg-zinc-950/60 px-6 py-6">
          <div className="flex flex-col items-center gap-4 pb-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800"
            >
              {preview || user?.avatar_url ? (
                <img
                  src={preview ?? user?.avatar_url ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-zinc-500">
                  {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs text-zinc-300">Change photo</span>
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
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Email</label>
              <p className="rounded-md border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-500">
                {user?.email}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-md bg-indigo-600 py-2 text-xs text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </BorderGlow>
      </div>
    </AppLayout>
  )
}
