<script lang="ts">
  import { onMount } from 'svelte'
  import { tmdbService, getPosterUrl } from '../services/tmdb'
  import type { TVShow } from '../types'
  import { link } from 'svelte-spa-router'

  let items: TVShow[] = []
  let loading = true
  let page = 1
  let totalPages = 1

  const load = async (nextPage: number) => {
    loading = true
    try {
      const res = await tmdbService.getPopularTVShows(nextPage)
      items = res.results
      page = res.page
      totalPages = res.total_pages
    } finally {
      loading = false
    }
  }

  onMount(() => {
    load(1)
  })
</script>

<section class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold">TV Shows</h1>
      <p class="mt-1 text-sm text-white/60">Popular TV shows from TMDB</p>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
        on:click={() => load(Math.max(1, page - 1))}
        disabled={loading || page <= 1}
      >
        Prev
      </button>
      <div class="text-sm text-white/60">Page {page} / {totalPages}</div>
      <button
        class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
        on:click={() => load(Math.min(totalPages, page + 1))}
        disabled={loading || page >= totalPages}
      >
        Next
      </button>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {#each Array(18) as _}
        <div class="aspect-[2/3] animate-pulse rounded-xl bg-white/5"></div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {#each items as tv (tv.id)}
        <a use:link href={`/tv/${tv.id}`} class="group overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div class="aspect-[2/3] overflow-hidden">
            <img
              src={getPosterUrl(tv.poster_path, 'w342')}
              alt={tv.name}
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div class="p-3">
            <div class="line-clamp-1 text-sm font-medium">{tv.name}</div>
            <div class="mt-1 text-xs text-white/60">
              {tv.first_air_date ? tv.first_air_date.slice(0, 4) : '—'} • ⭐ {tv.vote_average?.toFixed?.(1) ?? tv.vote_average}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>
