<script lang="ts">
  import { onMount } from 'svelte'
  import { tmdbService } from '../services/tmdb'
  import type { Movie } from '../types'
  import MediaCard from '../components/MediaCard.svelte'
  import { Film, ChevronLeft, ChevronRight } from 'lucide-svelte'

  let items: Movie[] = []
  let loading = true
  let page = 1
  let totalPages = 1

  const load = async (nextPage: number) => {
    loading = true
    try {
      const res = await tmdbService.getPopularMovies(nextPage)
      items = res.results
      page = res.page
      totalPages = res.total_pages
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      loading = false
    }
  }

  onMount(() => {
    load(1)
  })
</script>

<section class="space-y-10 pb-12 animate-in">
  <div class="flex flex-wrap items-end justify-between gap-6 px-2">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-black shadow-lg shadow-accent/20">
          <Film size={20} />
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white sm:text-4xl">Movies</h1>
      </div>
      <p class="text-sm font-bold uppercase tracking-widest text-white/30 ml-1">Explore the most popular films currently trending</p>
    </div>

    <!-- Pagination -->
    <div class="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-2 rounded-2xl backdrop-blur-3xl shadow-2xl">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 ring-1 ring-white/10 hover:bg-accent hover:text-black hover:ring-accent transition-all duration-300 disabled:opacity-20 active:scale-95"
        on:click={() => load(Math.max(1, page - 1))}
        disabled={loading || page <= 1}
      >
        <ChevronLeft size={18} />
      </button>
      <div class="px-2 text-xs font-black text-white/40 tracking-widest">
        <span class="text-white/80">{page}</span> / {totalPages}
      </div>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 ring-1 ring-white/10 hover:bg-accent hover:text-black hover:ring-accent transition-all duration-300 disabled:opacity-20 active:scale-95"
        on:click={() => load(Math.min(totalPages, page + 1))}
        disabled={loading || page >= totalPages}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
      {#each Array(12) as _}
        <div class="space-y-4">
          <div class="aspect-video animate-pulse rounded-2xl bg-gradient-to-br from-white/5 to-transparent ring-1 ring-white/5"></div>
          <div class="space-y-2">
            <div class="h-4 w-3/4 animate-pulse rounded-lg bg-white/5"></div>
            <div class="h-3 w-1/2 animate-pulse rounded-lg bg-white/5"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
      {#each items as m (m.id)}
        <MediaCard
          class="w-full"
          title={m.title}
          posterPath={m.poster_path}
          backdropPath={m.backdrop_path}
          href={`/movie/${m.id}`}
          meta={m.release_date ? m.release_date.slice(0, 4) : null}
          rating={m.vote_average}
        />
      {/each}
    </div>

    <!-- Bottom Pagination -->
    <div class="flex justify-center pt-12">
      <div class="flex items-center gap-6 bg-white/[0.03] border border-white/5 p-3 rounded-[32px] backdrop-blur-3xl shadow-2xl">
        <button
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 ring-1 ring-white/10 hover:bg-accent hover:text-black hover:ring-accent transition-all duration-300 disabled:opacity-20 active:scale-95"
          on:click={() => load(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
        >
          <ChevronLeft size={20} />
        </button>
        <div class="px-4 text-sm font-black text-white/40 tracking-[0.2em] uppercase">
          Page <span class="text-white/80">{page}</span> of {totalPages}
        </div>
        <button
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 ring-1 ring-white/10 hover:bg-accent hover:text-black hover:ring-accent transition-all duration-300 disabled:opacity-20 active:scale-95"
          on:click={() => load(Math.min(totalPages, page + 1))}
          disabled={loading || page >= totalPages}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  {/if}
</section>
