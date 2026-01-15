<script lang="ts">
  import { onMount } from 'svelte'
  import { link } from 'svelte-spa-router'
  import { authUser, authLoading, signInWithPassword, signUpWithPassword } from '../stores/auth'
  import { isSupabaseEnabled } from '../lib/supabaseClient'
  import { Mail, Lock, ArrowLeft, Loader2, Sparkles, Shield } from 'lucide-svelte'
  import { fade, fly } from 'svelte/transition'

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

<div class="fixed inset-0 z-[-1] overflow-hidden">
  <div class="absolute inset-0 bg-[#050505]"></div>
  <div 
    class="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat blur-sm scale-110"
    style="background-image: url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop');"
  ></div>
  <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
</div>

<section class="min-h-[80vh] flex items-center justify-center p-4">
  <div 
    class="w-full max-w-[440px] relative"
    in:fly={{ y: 20, duration: 600 }}
  >
    <!-- Logo/Brand area -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-yellow-400 mb-4 shadow-[0_0_40px_-5px_rgba(250,204,21,0.4)]">
        <Sparkles size={32} class="text-black" />
      </div>
      <h1 class="text-3xl font-black tracking-tighter text-white uppercase italic">Streame</h1>
      <p class="text-white/40 text-sm mt-1 font-medium">Elevate your streaming experience</p>
    </div>

    <div class="rounded-[32px] border border-white/10 bg-black/40 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
      <!-- Top Accent -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>

      <div class="flex items-center justify-between mb-8">
        <h2 class="text-xl font-bold text-white tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <a 
          use:link 
          href="/" 
          class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-yellow-400 transition-colors"
        >
          <ArrowLeft size={14} />
          Exit
        </a>
      </div>

      <div class="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 border border-white/5 mb-8">
        <button
          class={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            mode === 'signin' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-white/40 hover:text-white/70'
          }`}
          on:click={() => (mode = 'signin')}
        >
          Sign in
        </button>
        <button
          class={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            mode === 'signup' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-white/40 hover:text-white/70'
          }`}
          on:click={() => (mode = 'signup')}
        >
          Join now
        </button>
      </div>

      {#if error}
        <div 
          class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-200 flex items-start gap-3"
          in:fade
        >
          <div class="mt-0.5">⚠️</div>
          <div>{error}</div>
        </div>
      {/if}

      {#if info}
        <div 
          class="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-xs font-medium text-green-200 flex items-start gap-3"
          in:fade
        >
          <div class="mt-0.5">✨</div>
          <div>{info}</div>
        </div>
      {/if}

      <div class="space-y-5">
        <div class="space-y-2">
          <label for="login-email" class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Email Address</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-yellow-400/50 transition-colors">
              <Mail size={16} />
            </div>
            <input
              id="login-email"
              class="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:bg-white/[0.08] focus:ring-4 focus:ring-yellow-400/5"
              type="email"
              bind:value={email}
              placeholder="name@example.com"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="login-password" class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Secure Password</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-yellow-400/50 transition-colors">
              <Lock size={16} />
            </div>
            <input
              id="login-password"
              class="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:bg-white/[0.08] focus:ring-4 focus:ring-yellow-400/5"
              type="password"
              bind:value={password}
              placeholder="••••••••"
              autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
        </div>

        <button
          class="group relative mt-4 h-14 w-full overflow-hidden rounded-2xl bg-yellow-400 font-black text-black shadow-[0_20px_40px_-10px_rgba(250,204,21,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          on:click={submit}
          disabled={loading || $authLoading}
        >
          <div class="relative z-10 flex items-center justify-center gap-2">
            {#if loading || $authLoading}
              <Loader2 size={20} class="animate-spin" />
              <span>Verifying...</span>
            {:else}
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            {/if}
          </div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 transition-transform"></div>
        </button>

        <div class="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20 pt-4">
          <Shield size={12} />
          <span>{isSupabaseEnabled ? 'Cloud Protection Active' : 'Offline Mode'}</span>
        </div>
      </div>
    </div>
    
    <p class="text-center mt-8 text-white/20 text-xs px-8">
      By continuing, you agree to our terms of service and privacy policy. 
      Your data is securely synced with Supabase.
    </p>
  </div>
</section>
