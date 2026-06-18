'use client'

import { useState, type FormEvent } from 'react'
import { useAuth } from './auth-provider'
import Lightfall from '@/components/Lightfall'
import BorderGlow from '@/components/BorderGlow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type Mode = 'sign-in' | 'sign-up' | 'verify'

export function AuthPage() {
  const { signIn, signUp, verifyEmail } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  function resetForm() {
    setError('')
    setSubmitting(false)
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    resetForm()
    setSubmitting(true)
    const err = await signIn(email, password)
    if (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    resetForm()
    setSubmitting(true)
    const result = await signUp(email, password, name)
    if (result.error) {
      setError(result.error.message)
      setSubmitting(false)
      return
    }
    if (result.requireEmailVerification) {
      setVerificationEmail(email)
      setMode('verify')
      setSubmitting(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    resetForm()
    setSubmitting(true)
    const err = await verifyEmail(verificationEmail, otp)
    if (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSubmitting(false)
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Lightfall
          colors={['#6366f1', '#818cf8', '#a5b4fc']}
          streakCount={1}
          streakLength={0.3}
          speed={0.9}
          glow={1.5}
          density={1.5}
          zoom={2.5}
          backgroundGlow={0.4}
          opacity={0.9}
          mouseInteraction={false}
        />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        <BorderGlow
          glowColor="230 60 70"
          backgroundColor="#09090b"
          borderRadius={16}
          glowRadius={20}
          glowIntensity={0.6}
          className="w-full max-w-sm"
        >
          <Card className="border border-zinc-800/60 bg-zinc-950/70 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <CardHeader className="pb-4 pt-8 text-center">
              <CardTitle className="text-2xl font-light tracking-[0.2em] text-zinc-100 uppercase">
                flowstate
              </CardTitle>
              {mode === 'verify' ? (
                <CardDescription className="text-zinc-500">
                  Enter the 6-digit code sent to {verificationEmail}
                </CardDescription>
              ) : (
                <CardDescription className="text-zinc-500">
                  {mode === 'sign-in' ? 'Sign in to continue' : 'Create your account'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {error && (
                <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              {mode === 'verify' ? (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Verification code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="border-zinc-800 bg-zinc-900/50 text-center text-lg tracking-widest text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || otp.length < 6}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-950/30 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-900/40 disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify email'}
                  </Button>
                  <p className="text-center text-xs text-zinc-600">
                    Check your inbox for the verification code.
                  </p>
                </form>
              ) : mode === 'sign-up' ? (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Password</Label>
                    <Input
                      id="password-up"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-950/30 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-900/40 disabled:opacity-50"
                  >
                    {submitting ? 'Creating account...' : 'Create account'}
                  </Button>
                  <Separator className="bg-zinc-800/50" />
                  <p className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('sign-in')}
                      className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-in" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Email</Label>
                    <Input
                      id="email-in"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-in" className="text-xs font-medium tracking-wider text-zinc-400 uppercase">Password</Label>
                    <Input
                      id="password-in"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-950/30 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-900/40 disabled:opacity-50"
                  >
                    {submitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                  <Separator className="bg-zinc-800/50" />
                  <p className="text-center text-sm text-zinc-500">
                    No account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('sign-up')}
                      className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </BorderGlow>
      </div>
    </div>
  )
}
