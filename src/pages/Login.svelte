<script lang="ts">
  import { onMount } from 'svelte'
  import { link } from 'svelte-spa-router'
  import { authUser, authLoading, signInWithPassword, signUpWithPassword } from '../stores/auth'
  import { isSupabaseEnabled } from '../lib/supabaseClient'

  let mode: 'signin' | 'signup' = 'signin'
  let email = ''
  let password = ''
  let loading = false
  let error: string | null = null
  let info: string | null = null

  const REDIRECT_KEY = 'streame:post_login_redirect'

  const goBackOrHome = () => {
    try {
      const redirect = localStorage.getItem(REDIRECT_KEY)
      localStorage.removeItem(REDIRECT_KEY)
      if (redirect) {
        window.location.hash = redirect
        return
      }
    } catch {
      // ignore
    }
    window.location.hash = '#/'
  }

  onMount(() => {
    if ($authUser) {
      goBackOrHome()
    }
  })

  const submit = async () => {
    error = null
    info = null

    if (!email.trim() || !password.trim()) {
      error = 'Please enter email and password.'
      return
    }

    if (!isSupabaseEnabled) {
      error = 'Supabase is not configured.'
      return
    }

    loading = true
    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(email.trim(), password)
        if (res.error) {
          error = res.error.message
          return
        }
        goBackOrHome()
      } else {
        const res = await signUpWithPassword(email.trim(), password)
        if (res.error) {
          error = res.error.message
          return
        }
        info = 'Account created. If email confirmation is enabled, check your inbox.'
        if ((res.data as any)?.session) {
          goBackOrHome()
        }
      }
    } finally {
      loading = false
    }
  }
</script>

<section class="mx-auto w-full max-w-lg py-8">
  <div class="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <a use:link href="/" class="text-sm text-white/60 hover:text-white">Back</a>
    </div>

    <p class="mt-2 text-sm text-white/60">
      Sign in to sync your watchlist and see Continue Watching.
    </p>

    <div class="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-black/40 p-1 ring-1 ring-white/10">
      <button
        class={`rounded-xl px-3 py-2 text-sm font-medium ${
          mode === 'signin' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
        }`}
        on:click={() => (mode = 'signin')}
      >
        Sign in
      </button>
      <button
        class={`rounded-xl px-3 py-2 text-sm font-medium ${
          mode === 'signup' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
        }`}
        on:click={() => (mode = 'signup')}
      >
        Sign up
      </button>
    </div>

    {#if error}
      <div class="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    {/if}

    {#if info}
      <div class="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">
        {info}
      </div>
    {/if}

    <div class="mt-6 space-y-4">
      <div class="space-y-2">
        <label for="login-email" class="text-xs font-medium text-white/60">Email</label>
        <input
          id="login-email"
          class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/30 focus:ring-2 focus:ring-yellow-400/20"
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          autocomplete="email"
        />
      </div>

      <div class="space-y-2">
        <label for="login-password" class="text-xs font-medium text-white/60">Password</label>
        <input
          id="login-password"
          class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/30 focus:ring-2 focus:ring-yellow-400/20"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
      </div>

      <button
        class="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-400 text-sm font-black text-black shadow-[0_10px_20px_-5px_rgba(250,204,21,0.4)] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        on:click={submit}
        disabled={loading || $authLoading}
      >
        {#if mode === 'signin'}
          Sign in
        {:else}
          Create account
        {/if}
      </button>

      <div class="text-center text-xs text-white/50">
        Supabase: {isSupabaseEnabled ? 'Enabled' : 'Not configured'}
      </div>
    </div>
  </div>
</section>
