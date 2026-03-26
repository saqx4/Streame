<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { tmdbService, getPosterUrl } from "../services/tmdb";
  import MediaCard from "../components/MediaCard.svelte";
  import { link } from "svelte-spa-router";
  import { LayoutGrid, Film, Tv } from "lucide-svelte";

  let query = "";
  let loading = false;
  let error: string | null = null;
  let page = 1;
  let totalPages = 1;
  let selectedType: "all" | "movie" | "tv" = "all";
  let selectedGenre: number | null = null;
  let year: string = "";
  let minRating: number = 0;
  let sortBy:
    | "relevance"
    | "rating_desc"
    | "rating_asc"
    | "year_desc"
    | "year_asc" = "relevance";

  let filtersOpen = false;

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
    const isMovie = item.media_type === "movie" || Boolean(item.title);
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      posterPath: item.poster_path ?? null,
      backdropPath: item.backdrop_path ?? null,
      href: isMovie ? `/movie/${item.id}` : `/tv/${item.id}`,
      typeLabel: isMovie ? "Movie" : "Tv",
      rating: item.vote_average ? item.vote_average : 0,
      year: isMovie
        ? item.release_date
          ? String(item.release_date).slice(0, 4)
          : null
        : item.first_air_date
          ? String(item.first_air_date).slice(0, 4)
          : null,
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
      let res;
      if (selectedType === "movie") {
        res = await tmdbService.searchMovies(query.trim(), nextPage);
      } else if (selectedType === "tv") {
        res = await tmdbService.searchTVShows(query.trim(), nextPage);
      } else {
        res = await tmdbService.searchMulti(query.trim(), nextPage);
      }

      results = normalize(res.results as any);

      if (selectedGenre) {
        results = results.filter((x) =>
          Array.isArray(x.genre_ids) ? x.genre_ids.includes(selectedGenre) : false,
        );
      }

      if (year.trim()) {
        const y = year.trim();
        results = results.filter((x) => {
          const isMovie = x.media_type === "movie" || Boolean(x.title);
          const raw = isMovie ? x.release_date : x.first_air_date;
          const itemYear = raw ? String(raw).slice(0, 4) : "";
          return itemYear === y;
        });
      }

      if (minRating > 0) {
        results = results.filter(
          (x) => typeof x.vote_average === "number" && x.vote_average >= minRating,
        );
      }

      if (sortBy !== "relevance") {
        const getYear = (x: any) => {
          const isMovie = x.media_type === "movie" || Boolean(x.title);
          const raw = isMovie ? x.release_date : x.first_air_date;
          const v = raw ? Number(String(raw).slice(0, 4)) : NaN;
          return Number.isFinite(v) ? v : 0;
        };

        results = [...results].sort((a: any, b: any) => {
          if (sortBy === "rating_desc") {
            return (b.vote_average ?? 0) - (a.vote_average ?? 0);
          }
          if (sortBy === "rating_asc") {
            return (a.vote_average ?? 0) - (b.vote_average ?? 0);
          }
          if (sortBy === "year_desc") {
            return getYear(b) - getYear(a);
          }
          if (sortBy === "year_asc") {
            return getYear(a) - getYear(b);
          }
          return 0;
        });
      }

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

  $: query, selectedType, selectedGenre, year, minRating, sortBy, scheduleSearch();

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<div class="flex flex-col items-center gap-8 py-4 sm:gap-12 sm:py-8 animate-in">
  <!-- Search Bar Section -->
  <div class="flex w-full flex-col items-center gap-6 sm:gap-8">
    <div class="relative w-full max-w-[600px] group px-2 sm:px-0">
      <div class="absolute inset-0 rounded-[32px] bg-yellow-400/20 blur-2xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-40"></div>
      <input
        type="text"
        bind:value={query}
        on:keydown={handleKeydown}
        placeholder="Search movies or TV..."
        class="relative w-full rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 px-6 py-4 sm:px-8 sm:py-5 text-sm sm:text-base font-medium text-white placeholder:text-white/20 focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400/40 outline-none shadow-2xl backdrop-blur-3xl transition-all"
      />
      <div
        class="absolute right-6 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-white/30 uppercase border border-white/5 hidden sm:block"
      >
        Esc
      </div>
    </div>

    <!-- Tabs & Quick Filters -->
    <div class="flex w-full max-w-[1000px] flex-col gap-4 sm:gap-6 px-2 sm:px-0">
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          class={`flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
            selectedType === "all"
              ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
          }`}
          on:click={() => (selectedType = "all")}
        >
          <LayoutGrid size={14} class="sm:w-4 sm:h-4" />
          All
        </button>

        <button
          class={`flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
            selectedType === "movie"
              ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
          }`}
          on:click={() => (selectedType = "movie")}
        >
          <Film size={14} class="sm:w-4 sm:h-4" />
          Movies
        </button>

        <button
          class={`flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
            selectedType === "tv"
              ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
          }`}
          on:click={() => (selectedType = "tv")}
        >
          <Tv size={14} class="sm:w-4 sm:h-4" />
          TV
        </button>

        <div class="h-6 w-px bg-white/10 mx-0.5 sm:mx-1"></div>

        <button
          class={`flex items-center gap-2 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
            filtersOpen
              ? "bg-white/10 text-yellow-400 ring-2 ring-yellow-400/40"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
          }`}
          on:click={() => (filtersOpen = !filtersOpen)}
        >
          Filters
        </button>
      </div>

      {#if filtersOpen}
        <div 
          class="w-full rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/[0.02] p-4 sm:p-6 backdrop-blur-3xl shadow-2xl"
          in:fly={{ y: -20, duration: 400 }}
        >
          <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div class="space-y-1.5">
              <label class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Genre</label>
              <select
                class="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white/80 outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all appearance-none"
                bind:value={selectedGenre}
              >
                <option value={null}>Any Genre</option>
                {#each Object.entries(genreMap) as [id, name]}
                  <option value={Number(id)}>{name}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Year</label>
              <input
                class="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white/80 outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
                inputmode="numeric"
                placeholder="e.g. 2024"
                maxlength="4"
                bind:value={year}
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Min Rating</label>
              <select
                class="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white/80 outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all appearance-none"
                bind:value={minRating}
              >
                <option value={0}>Any Rating</option>
                <option value={5}>5.0+</option>
                <option value={7}>7.0+</option>
                <option value={8}>8.0+</option>
                <option value={9}>9.0+</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Sort By</label>
              <select
                class="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white/80 outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all appearance-none"
                bind:value={sortBy}
              >
                <option value="relevance">Relevance</option>
                <option value="rating_desc">Top Rated</option>
                <option value="year_desc">Newest First</option>
                <option value="year_asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Results Heading -->
  {#if query.trim()}
    <div class="w-full border-b border-white/5 pb-3 sm:pb-4 px-2 sm:px-0">
      <h2 class="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-white/20">
        Results for <span class="text-yellow-400/80 ml-1 sm:ml-2">{query}</span>
      </h2>
    </div>
  {/if}

  <!-- Error / Loading / Results Grid -->
  {#if error}
    <div class="w-full rounded-[24px] sm:rounded-[32px] border border-red-500/20 bg-red-500/5 p-6 sm:p-8 text-center mx-2">
      <p class="text-red-400 text-sm sm:text-base font-bold">{error}</p>
    </div>
  {:else if loading}
    <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2 sm:px-0 w-full">
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
  {:else if results.length > 0}
    <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2 sm:px-0 w-full">
      {#each results as item (item.id)}
        {@const res = toResult(item)}
        <MediaCard
          class="w-full"
          title={res.title}
          posterPath={res.posterPath}
          backdropPath={res.backdropPath}
          href={res.href}
          meta={res.year}
          rating={res.rating}
        />
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6">
        <button
          class="rounded-xl sm:rounded-[20px] bg-white/5 px-6 py-3 sm:px-8 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40 ring-1 ring-white/10 transition-all hover:bg-yellow-400 hover:text-black hover:ring-yellow-400 disabled:opacity-20"
          on:click={() => load(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
        >
          Prev
        </button>
        <div class="text-[10px] sm:text-xs font-black text-white/20 tracking-widest">
          <span class="text-white/60">{page}</span> / {totalPages}
        </div>
        <button
          class="rounded-xl sm:rounded-[20px] bg-white/5 px-6 py-3 sm:px-8 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40 ring-1 ring-white/10 transition-all hover:bg-yellow-400 hover:text-black hover:ring-yellow-400 disabled:opacity-20"
          on:click={() => load(Math.min(totalPages, page + 1))}
          disabled={loading || page >= totalPages}
        >
          Next
        </button>
      </div>
    {/if}
  {:else if query.trim() && !loading}
    <div class="w-full py-20 sm:py-32 text-center">
      <p class="text-white/20 text-xs sm:text-sm font-bold tracking-widest uppercase">No results found for "{query}"</p>
    </div>
  {/if}
</div>

<style>
  /* Remove default ring on focus */
  input:focus {
    box-shadow: none !important;
  }
</style>
