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

  const SERVER_KEY = 'streame:preferredServer'
  const NO_AUDIO_KEY = 'streame_no_audio_dismissed'

  let preferredServer: PlayerServerKey = 'server7'
  let showNoAudioBadge = true

  let userEmail: string | null = null
  let loadingUser = true

  const loadFromStorage = () => {
    try {
      const v = localStorage.getItem(SERVER_KEY)
      if (v && isPlayerServerKey(v)) preferredServer = v
    } catch {
      // ignore
    }

    try {
      showNoAudioBadge = localStorage.getItem(NO_AUDIO_KEY) !== '1'
    } catch {
      showNoAudioBadge = true
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

  const toggleNoAudioBadge = () => {
    showNoAudioBadge = !showNoAudioBadge
    try {
      localStorage.setItem(NO_AUDIO_KEY, showNoAudioBadge ? '0' : '1')
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

  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div class="text-sm font-semibold">Playback server</div>
    <p class="mt-1 text-xs text-white/50">Used by the Watch page as default.</p>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      {#each playerServerOptions as s}
        <button
          class={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
            preferredServer === s.key
              ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200'
              : 'border-white/10 bg-black/20 text-white/80 hover:bg-white/5'
          }`}
          on:click={() => setPreferredServer(s.key)}
        >
          <span>{s.label}</span>
          {#if preferredServer === s.key}
            <span class="text-xs text-yellow-200/80">Selected</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="text-sm font-semibold">No Audio badge</div>
        <p class="mt-1 text-xs text-white/50">Show/hide the bottom-right “No Audio” badge.</p>
      </div>
      <button
        class={`rounded-xl border px-3 py-2 text-xs font-medium ${
          showNoAudioBadge
            ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
            : 'border-white/10 bg-black/30 text-white/60 hover:bg-white/5'
        }`}
        on:click={toggleNoAudioBadge}
      >
        {showNoAudioBadge ? 'On' : 'Off'}
      </button>
    </div>
  </div>

  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div class="text-sm font-semibold">Account</div>
    <p class="mt-1 text-xs text-white/50">
      Supabase:
      {#if isSupabaseEnabled}
        Enabled
      {:else}
        Not configured
      {/if}
    </p>

    <div class="mt-3 text-sm text-white/70">
      {#if loadingUser}
        Loading user...
      {:else if $authUser}
        Signed in as <span class="font-semibold text-white">{$authUser.email ?? userEmail}</span>
      {:else}
        Not signed in.
      {/if}
    </div>

    {#if isSupabaseEnabled}
      <div class="mt-4 flex flex-wrap items-center gap-2">
        {#if $authUser}
          <button
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
            on:click={async () => {
              await signOut()
              await loadUser()
            }}
            disabled={$authLoading}
          >
            Sign out
          </button>
        {:else}
          <button
            class="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
            on:click={() => redirectToLogin(window.location.hash || '#/settings')}
          >
            Sign in
          </button>
        {/if}
      </div>
    {/if}
  </div>
</section>
