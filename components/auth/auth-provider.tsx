'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { insforge } from '@/lib/insforge'
import type { User, AuthError } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthError | null>
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null; requireEmailVerification?: boolean; verifyEmailMethod?: string }>
  verifyEmail: (email: string, otp: string) => Promise<AuthError | null>
  signOut: () => Promise<void>
  setProfile: (profile: { name?: string; avatar_url?: string }) => Promise<AuthError | null>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(u: { id: string; email?: string | null; profile?: Record<string, unknown> | null }): User {
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.profile?.name as string | undefined) ?? undefined,
    avatar_url: (u.profile?.avatar_url as string | undefined) ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data, error }) => {
      if (!error && data?.user) {
        setUser(toUser(data.user))
      }
      setLoading(false)
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthError | null> => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) return { message: error.message, code: String(error.statusCode ?? '') }
    if (data?.user) {
      setUser(toUser(data.user))
    }
    return null
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name })
    if (error) return { error: { message: error.message, code: String(error.statusCode ?? '') } }
    if (data?.requireEmailVerification) {
      return { error: null, requireEmailVerification: true, verifyEmailMethod: 'code' }
    }
    if (data?.accessToken && data?.user) {
      setUser(toUser(data.user))
    }
    return { error: null }
  }, [])

  const verifyEmail = useCallback(async (email: string, otp: string): Promise<AuthError | null> => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp })
    if (error) return { message: error.message, code: String(error.statusCode ?? '') }
    if (data?.user) {
      setUser(toUser(data.user))
    }
    return null
  }, [])

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
    setUser(null)
  }, [])

  const setProfile = useCallback(async (profile: { name?: string; avatar_url?: string }): Promise<AuthError | null> => {
    const { error } = await insforge.auth.setProfile(profile)
    if (error) return { message: error.message, code: String(error.statusCode ?? '') }
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser()
    if (userError) return { message: userError.message }
    if (userData?.user) {
      setUser(toUser(userData.user))
    }
    return null
  }, [])

  const refreshUser = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    if (!error && data?.user) {
      setUser(toUser(data.user))
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, verifyEmail, signOut, setProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
