<script lang="ts">
  import { onMount } from 'svelte'
  import MediaCard from '../components/MediaCard.svelte'
  import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'
  import { userMediaService, type MediaItem } from '../services/userMedia'
  import { redirectToLogin } from '../lib/loginRedirect'

  type StoredItem = MediaItem & { added_at?: string }

  const LOCAL_KEY = 'streame:watchlist'

  let loading = true
  let error: string | null = null

  let userId: string | null = null
  let items: StoredItem[] = []

  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      const parsed = raw ? (JSON.parse(raw) as StoredItem[]) : []
      items = Array.isArray(parsed) ? parsed : []
    } catch {
      items = []
    }
  }

  const saveLocal = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }

  const load = async () => {
    loading = true
    error = null
    try {
      if (isSupabaseEnabled) {
        const { data } = await supabase.auth.getUser()
        userId = data?.user?.id ?? null
      } else {
        userId = null
      }

      if (userId) {
        const rows = await userMediaService.list(userId, 'watchlist')
        items = (rows as any[]).map((r) => ({
          tmdb_id: r.tmdb_id,
          type: r.type,
          title: r.title,
          poster_path: r.poster_path ?? null,
          added_at: r.created_at,
        }))
      } else {
        loadLocal()
      }
    } catch (e: any) {
      error = e?.message ?? 'Failed to load watchlist'
    } finally {
      loading = false
    }
  }

  const removeItem = async (tmdb_id: number) => {
    const next = items.filter((i) => i.tmdb_id !== tmdb_id)
    items = next

    if (userId) {
      try {
        await userMediaService.remove(userId, tmdb_id, 'watchlist')
      } catch (e) {
        // keep UI responsive even if it fails
        console.warn('Failed to remove from watchlist', e)
      }
    } else {
      saveLocal()
    }
  }

  const hrefFor = (it: StoredItem) => (it.type === 'movie' ? `/movie/${it.tmdb_id}` : `/tv/${it.tmdb_id}`)

  onMount(() => {
    load()
  })
</script>

<section class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold">Watchlist</h1>
      <p class="mt-1 text-sm text-white/60">
        {#if userId}
          Synced with your account.
        {:else}
          Stored on this device.
        {/if}
      </p>
    </div>

    <button
      class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
      on:click={load}
      disabled={loading}
    >
      Refresh
    </button>
  </div>

  {#if error}
    <div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
      {error}
    </div>
  {/if}

  {#if !loading && !userId && isSupabaseEnabled}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="text-sm font-semibold">Sync your watchlist</div>
          <div class="mt-1 text-xs text-white/60">Sign in to access your watchlist on any device.</div>
        </div>
        <button
          class="inline-flex h-10 items-center justify-center rounded-xl bg-yellow-400 px-4 text-xs font-black text-black"
          on:click={() => redirectToLogin(window.location.hash || '#/watchlist')}
        >
          Sign in
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {#each Array(18) as _}
        <div class="aspect-[2/3] animate-pulse rounded-xl bg-white/5"></div>
      {/each}
    </div>
  {:else if items.length === 0}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
      Your watchlist is empty.
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {#each items as it (it.tmdb_id)}
        <div class="group relative">
          <MediaCard title={it.title} posterPath={it.poster_path} href={hrefFor(it)} />
          <button
            class="absolute right-2 top-2 rounded-xl border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-white/80 opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100"
            on:click={() => removeItem(it.tmdb_id)}
            aria-label="Remove"
          >
            Remove
          </button>
        </div>
      {/each}
    </div>
  {/if}
</section>
