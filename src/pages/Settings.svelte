<script lang="ts">
  import { onMount } from 'svelte'
  import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'
  import {
    playerServerOptions,
    type PlayerServerKey,
    isPlayerServerKey,
  } from '../services/playerServers'
  import { authUser, authLoading, signOut } from '../stores/auth'
  import { redirectToLogin } from '../lib/loginRedirect'
  import { LogOut, LogIn, User, Cloud, Server as ServerIcon, ShieldCheck } from 'lucide-svelte'

  const SERVER_KEY = 'streame:preferredServer'

  let preferredServer: PlayerServerKey = 'server7'

  let userEmail: string | null = null
  let loadingUser = true

  const loadFromStorage = () => {
    try {
      const v = localStorage.getItem(SERVER_KEY)
      if (v && isPlayerServerKey(v)) preferredServer = v
    } catch {
      // ignore
    }
  }

  const setPreferredServer = (id: PlayerServerKey) => {
    preferredServer = id
    try {
      localStorage.setItem(SERVER_KEY, id)
    } catch {
      // ignore
    }
  }

  const loadUser = async () => {
    loadingUser = true
    try {
      if (!isSupabaseEnabled) {
        userEmail = null
        return
      }
      const { data } = await supabase.auth.getUser()
      userEmail = data?.user?.email ?? null
    } finally {
      loadingUser = false
    }
  }

  onMount(() => {
    loadFromStorage()
    loadUser()
  })
</script>

<section class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold">Settings</h1>
    <p class="mt-1 text-sm text-white/60">Customize your playback and UI preferences</p>
  </div>

  <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
    <div class="flex items-center gap-3 mb-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        <ServerIcon size={20} />
      </div>
      <div>
        <div class="text-sm font-bold tracking-tight text-white">Playback Server</div>
        <p class="text-[11px] text-white/40">Default server for the watch page</p>
      </div>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      {#each playerServerOptions as s}
        <button
          class={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
            preferredServer === s.key
              ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200 shadow-[0_0_20px_-10px_rgba(250,204,21,0.5)]'
              : 'border-white/5 bg-black/20 text-white/70 hover:bg-white/5 hover:border-white/10'
          }`}
          on:click={() => setPreferredServer(s.key)}
        >
          <span class="font-medium">{s.label}</span>
          {#if preferredServer === s.key}
            <div class="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-400">
          <User size={20} />
        </div>
        <div>
          <div class="text-sm font-bold tracking-tight text-white">Account & Sync</div>
          <p class="text-[11px] text-white/40">Manage your profile and cloud sync</p>
        </div>
      </div>
      
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
        <Cloud size={12} class={isSupabaseEnabled ? 'text-green-400' : 'text-white/20'} />
        <span class="text-[10px] font-bold uppercase tracking-wider text-white/40">
          {isSupabaseEnabled ? 'Cloud Active' : 'Local Only'}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between rounded-2xl bg-black/20 p-4 border border-white/5">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10 text-white/40 shadow-inner">
            {#if $authUser}
              <span class="text-lg font-bold text-white/80">{$authUser.email?.[0].toUpperCase()}</span>
            {:else}
              <User size={24} />
            {/if}
          </div>
          <div>
            {#if loadingUser}
              <div class="h-4 w-24 bg-white/5 animate-pulse rounded"></div>
            {:else if $authUser}
              <div class="text-sm font-bold text-white">{$authUser.email ?? userEmail}</div>
              <div class="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={10} class="text-green-400" />
                <span class="text-[10px] text-green-400/80 font-medium">Verified Account</span>
              </div>
            {:else}
              <div class="text-sm font-bold text-white/80">Guest User</div>
              <div class="text-[10px] text-white/40 mt-0.5">Sign in to sync your library</div>
            {/if}
          </div>
        </div>

        {#if isSupabaseEnabled}
          {#if $authUser}
            <button
              class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50"
              on:click={async () => {
                await signOut()
                await loadUser()
              }}
              disabled={$authLoading}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          {:else}
            <button
              class="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-black text-black shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 active:scale-95"
              on:click={() => redirectToLogin(window.location.hash || '#/settings')}
            >
              <LogIn size={14} />
              Sign In
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>
