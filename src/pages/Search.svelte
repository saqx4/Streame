<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { tmdbService, getPosterUrl } from "../services/tmdb";
  import { link } from "svelte-spa-router";

  let query = "";
  let loading = false;
  let error: string | null = null;
  let page = 1;
  let totalPages = 1;

  type SearchItem = any;
  let results: SearchItem[] = [];

  let debounceTimer: any = null;

  // Hardcoded genre map since we don't want to fetch them every time for a simple layout
  const genreMap: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
  };

  const normalize = (items: SearchItem[]) =>
    items
      .filter((x) => x && (x.title || x.name))
      .filter(
        (x) =>
          x.media_type === "movie" ||
          x.media_type === "tv" ||
          x.title ||
          x.name,
      );

  const toResult = (item: SearchItem) => {
    const isMovie = Boolean(item.title);
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      posterPath: item.poster_path ?? null,
      href: isMovie ? `/movie/${item.id}` : `/tv/${item.id}`,
      typeLabel: isMovie ? "Movie" : "Tv",
      rating: item.vote_average ? item.vote_average.toFixed(1) : "—",
      year: isMovie
        ? item.release_date
          ? String(item.release_date).slice(0, 4)
          : "—"
        : item.first_air_date
          ? String(item.first_air_date).slice(0, 4)
          : "—",
      lang: String(item.original_language || "EN").toUpperCase(),
      genre: item.genre_ids?.length ? genreMap[item.genre_ids[0]] : "General",
    };
  };

  const load = async (nextPage: number) => {
    if (!query.trim()) {
      results = [];
      page = 1;
      totalPages = 1;
      error = null;
      return;
    }

    loading = true;
    error = null;
    try {
      const res = await tmdbService.searchMulti(query.trim(), nextPage);
      results = normalize(res.results as any);
      page = res.page;
      totalPages = res.total_pages;
    } catch (e: any) {
      error = e?.message ?? "Search failed";
    } finally {
      loading = false;
    }
  };

  const scheduleSearch = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      load(1);
    }, 350);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      query = "";
    }
  };

  $: query, scheduleSearch();

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<div class="flex flex-col items-center gap-10 py-6">
  <!-- Search Bar Section -->
  <div class="flex w-full flex-col items-center gap-6">
    <div class="relative w-full max-w-[500px]">
      <input
        type="text"
        bind:value={query}
        on:keydown={handleKeydown}
        placeholder="the office"
        class="w-full rounded-full border-none bg-zinc-900/90 px-6 py-4 text-sm font-medium text-yellow-500 placeholder:text-yellow-600/30 focus:ring-2 focus:ring-yellow-500/20 outline-none shadow-2xl transition-all"
      />
      <div
        class="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500 ring-1 ring-white/5 uppercase"
      >
        Esc
      </div>
    </div>

    <!-- Active Tab (Fixed to General as requested) -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-2 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-6 py-2.5 text-xs font-bold text-yellow-500"
      >
        <span class="opacity-80">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><rect x="3" y="3" width="7" height="7"></rect><rect
              x="14"
              y="3"
              width="7"
              height="7"
            ></rect><rect x="14" y="14" width="7" height="7"></rect><rect
              x="3"
              y="14"
              width="7"
              height="7"
            ></rect></svg
          >
        </span>
        General
      </button>
    </div>
  </div>

  <!-- Results Heading -->
  {#if query.trim()}
    <div class="w-full text-left">
      <h2 class="text-2xl font-semibold text-zinc-400">
        showing result for <span class="text-yellow-500 font-bold ml-1"
          >{query}</span
        >
      </h2>
    </div>
  {/if}

  <!-- Error / Loading / Results Grid -->
  {#if error}
    <div
      class="w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-200 shadow-xl"
    >
      {error}
    </div>
  {:else if loading}
    <div class="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {#each Array(9) as _}
        <div
          class="h-40 animate-pulse rounded-[32px] bg-white/5 ring-1 ring-white/10"
        ></div>
      {/each}
    </div>
  {:else if results.length > 0}
    <div
      class="grid w-full grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3"
    >
      {#each results as item (item.id)}
        {@const res = toResult(item)}
        <a
          use:link
          href={res.href}
          class="group flex items-center gap-5 transition-transform hover:scale-[1.02]"
        >
          <!-- Poster -->
          <div
            class="relative h-44 w-32 flex-none overflow-hidden rounded-[24px] shadow-2xl ring-1 ring-white/10 transition-shadow group-hover:shadow-yellow-500/10"
          >
            <img
              src={getPosterUrl(res.posterPath, "w342")}
              alt={res.title}
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <!-- Metadata -->
          <div class="flex flex-col gap-1.5 overflow-hidden">
            <h3
              class="line-clamp-1 text-xl font-bold text-white transition-colors group-hover:text-yellow-500"
            >
              {res.title}
            </h3>
            <div
              class="flex items-center gap-2 text-[13px] font-medium text-zinc-500"
            >
              <span>{res.typeLabel}</span>
              <span class="h-1 w-1 rounded-full bg-zinc-600"></span>
              <span>{res.rating}</span>
              <span class="h-1 w-1 rounded-full bg-zinc-600"></span>
              <span>{res.year}</span>
              <span class="h-1 w-1 rounded-full bg-zinc-600"></span>
              <span>{res.lang}</span>
            </div>
            <div class="text-[13px] font-medium text-zinc-500 capitalize">
              {res.genre}
            </div>
          </div>
        </a>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-8 flex items-center gap-4">
        <button
          class="rounded-2xl border border-white/10 bg-zinc-900/50 px-6 py-3 text-sm font-bold text-white/70 transition-all hover:bg-zinc-800 disabled:opacity-20"
          on:click={() => load(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
        >
          Previous
        </button>
        <div class="text-sm font-bold text-zinc-500">
          {page} / {totalPages}
        </div>
        <button
          class="rounded-2xl border border-white/10 bg-zinc-900/50 px-6 py-3 text-sm font-bold text-white/70 transition-all hover:bg-zinc-800 disabled:opacity-20"
          on:click={() => load(Math.min(totalPages, page + 1))}
          disabled={loading || page >= totalPages}
        >
          Next
        </button>
      </div>
    {/if}
  {:else if query.trim() && !loading}
    <div class="w-full py-20 text-center text-zinc-500 lg:text-lg">
      No results found for "{query}"
    </div>
  {/if}
</div>

<style>
  /* Remove default ring on focus */
  input:focus {
    box-shadow: none !important;
  }
</style>
