<script lang="ts">
  import { onMount } from 'svelte'
  import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'
  import { authUser, authLoading, signOut } from '../stores/auth'
  import { redirectToLogin } from '../lib/loginRedirect'
  import { link } from 'svelte-spa-router'
  import { LogOut, LogIn, User, Cloud, ShieldCheck, Settings2, Server } from 'lucide-svelte'

  let userEmail: string | null = null
  let isAdmin = false
  let loadingUser = true

  const loadUser = async () => {
    loadingUser = true
    try {
      if (!isSupabaseEnabled) {
        userEmail = null
        isAdmin = false
        return
      }
      const { data } = await supabase.auth.getUser()
      userEmail = data?.user?.email ?? null

      if (userEmail) {
        const { data: adminData } = await supabase.rpc('is_admin')
        isAdmin = !!adminData
      } else {
        isAdmin = false
      }
    } finally {
      loadingUser = false
    }
  }

  onMount(() => {
    loadUser()
  })
</script>

<section class="max-w-[800px] mx-auto space-y-8 pb-12 animate-in">
  <div>
    <h1 class="text-3xl font-black tracking-tight">Settings</h1>
    <p class="mt-1 text-sm font-bold text-white/40 uppercase tracking-widest">Personalize your experience</p>
  </div>

  <!-- Account Section -->
  <div class="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-3xl shadow-2xl">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20">
          <User size={24} />
        </div>
        <div>
          <h2 class="text-lg font-black tracking-tight text-white">Account & Sync</h2>
          <p class="text-xs font-bold text-white/30 uppercase tracking-widest">Manage your profile</p>
        </div>
      </div>
      
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
        <Cloud size={14} class={isSupabaseEnabled ? 'text-green-400' : 'text-white/20'} />
        <span class="text-[10px] font-black uppercase tracking-wider text-white/40">
          {isSupabaseEnabled ? 'Cloud Active' : 'Local Only'}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl bg-black/20 p-6 border border-white/5">
        <div class="flex items-center gap-4">
          <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10 text-white/40 shadow-inner">
            {#if $authUser}
              <span class="text-xl font-black text-white/80">{$authUser.email?.[0].toUpperCase()}</span>
            {:else}
              <User size={28} />
            {/if}
          </div>
          <div class="min-w-0">
            {#if loadingUser}
              <div class="h-5 w-32 bg-white/5 animate-pulse rounded-lg"></div>
            {:else if $authUser}
              <div class="text-base font-black text-white truncate">{$authUser.email ?? userEmail}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <ShieldCheck size={12} class="text-green-400" />
                <span class="text-[10px] text-green-400 font-black uppercase tracking-widest">Verified</span>
              </div>
            {:else}
              <div class="text-base font-black text-white/80">Guest User</div>
              <div class="text-[10px] text-white/40 mt-1 font-bold uppercase tracking-widest">Sign in to sync library</div>
            {/if}
          </div>
        </div>

        {#if isSupabaseEnabled}
          {#if $authUser}
            <button
              class="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black text-white/70 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50"
              on:click={async () => {
                await signOut()
                await loadUser()
              }}
              disabled={$authLoading}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          {:else}
            <button
              class="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-black shadow-xl shadow-white/10 transition-all hover:bg-yellow-400 hover:shadow-yellow-400/20 active:scale-95"
              on:click={() => redirectToLogin(window.location.hash || '#/settings')}
            >
              <LogIn size={16} />
              Sign In
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  {#if isAdmin}
    <div class="rounded-[32px] border border-yellow-400/20 bg-yellow-400/5 p-8 backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-xl shadow-yellow-400/20">
            <Server size={28} />
          </div>
          <div>
            <h2 class="text-lg font-black tracking-tight text-white mb-0.5 uppercase tracking-widest">Admin Controls</h2>
            <p class="text-xs font-bold text-white/50 uppercase tracking-widest">System Management</p>
          </div>
        </div>
        <a
          use:link
          href="/admin"
          class="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-xs font-black text-black shadow-xl shadow-yellow-400/20 transition-all hover:scale-105 active:scale-95"
        >
          <Settings2 size={18} />
          Open Dashboard
        </a>
      </div>
    </div>
  {/if}
</section>
