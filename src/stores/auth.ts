import { writable } from 'svelte/store'
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthResult = {
  data: any | null
  error: any | null
}

export const authUser = writable<AuthUser | null>(null)
export const authLoading = writable(true)

let initialized = false
let unsubscribe: (() => void) | null = null

export const initAuth = async () => {
  if (initialized) return
  initialized = true

  authLoading.set(true)

  try {
    if (!isSupabaseEnabled) {
      authUser.set(null)
      return
    }

    const { data } = await supabase.auth.getUser()
    authUser.set({
      id: data?.user?.id ?? '',
      email: data?.user?.email ?? null,
    })

    if (!data?.user?.id) {
      authUser.set(null)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      if (!u) {
        authUser.set(null)
        return
      }
      authUser.set({ id: u.id, email: u.email ?? null })
    })

    unsubscribe = () => sub.subscription.unsubscribe()
  } catch {
    authUser.set(null)
  } finally {
    authLoading.set(false)
  }
}

export const destroyAuth = () => {
  if (unsubscribe) unsubscribe()
  unsubscribe = null
  initialized = false
}

export const signInWithPassword = async (email: string, password: string) => {
  if (!isSupabaseEnabled) {
    const res: AuthResult = { data: null, error: { message: 'Supabase not configured' } }
    return res
  }
  authLoading.set(true)
  try {
    const res: any = await supabase.auth.signInWithPassword({ email, password })
    if (res?.error) return { data: res.data ?? null, error: res.error } as AuthResult
    const u = res?.data?.user
    authUser.set(u ? { id: u.id, email: u.email ?? null } : null)
    return { data: res.data ?? null, error: null } as AuthResult
  } finally {
    authLoading.set(false)
  }
}

export const signUpWithPassword = async (email: string, password: string) => {
  if (!isSupabaseEnabled) {
    const res: AuthResult = { data: null, error: { message: 'Supabase not configured' } }
    return res
  }
  authLoading.set(true)
  try {
    const res: any = await supabase.auth.signUp({ email, password })
    if (res?.error) return { data: res.data ?? null, error: res.error } as AuthResult
    const u = res?.data?.user
    authUser.set(u ? { id: u.id, email: u.email ?? null } : null)
    return { data: res.data ?? null, error: null } as AuthResult
  } finally {
    authLoading.set(false)
  }
}

export const signOut = async () => {
  if (!isSupabaseEnabled) return
  authLoading.set(true)
  try {
    await supabase.auth.signOut()
    authUser.set(null)
  } finally {
    authLoading.set(false)
  }
}

if (typeof window !== 'undefined') {
  void initAuth()
}
