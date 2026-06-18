export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export type AuthMode = 'sign-in' | 'sign-up' | 'verify'

export type AuthError = {
  message: string
  code?: string
}
