<script lang="ts">
  import { derived } from "svelte/store";
  import { params, link } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { tmdbService, getImageUrl } from "../services/tmdb";
  import type { TVShowDetails } from "../types";
  import DetailLayout from "../components/DetailLayout.svelte";
  import MediaCard from "../components/MediaCard.svelte";
  import { Play, ChevronDown, Check } from "lucide-svelte";

  const tvId = derived(params, ($p) => Number(($p as any)?.id));

  let tv: TVShowDetails | null = null;
  let cast: any[] = [];
  let reviews: any[] = [];
  let related: any[] = [];
  let seasonData: any = null;
  let selectedSeason = 1;
  let seasonPickerOpen = false;
  let loading = true;
  let loadingEpisodes = false;
  let error: string | null = null;
  let activeTab = "episodes";

  let seasonPickerEl: HTMLDivElement | null = null;

  const getSeasonLabel = (num: number) => {
    const s = tv?.seasons?.find((x: any) => Number(x?.season_number) === Number(num));
    if (!s) return `Season ${num}`;
    return `${s.name} (${s.episode_count} episodes)`;
  };

  const load = async (id: number) => {
    if (!id) return;
    loading = true;
    error = null;
    try {
      const [details, credits, reviewsRes, recommendations] = await Promise.all(
        [
          tmdbService.getTVShowDetails(id),
          tmdbService.getTVShowCredits(id),
          tmdbService.getTVShowReviews(id),
          tmdbService.getTVShowRecommendations(id),
        ],
      );
      tv = details;
      cast = credits.cast.slice(0, 20);
      reviews = reviewsRes.results.slice(0, 10);
      related = recommendations.results.slice(0, 20);

      if (tv.seasons?.length) {
        selectedSeason = tv.seasons[0].season_number || 1;
        await loadSeason(selectedSeason);
      }
    } catch (e: any) {
      error = e?.message ?? "Failed to load show";
    } finally {
      loading = false;
    }
  };

  const loadSeason = async (num: number) => {
    if (!tv) return;
    loadingEpisodes = true;
    try {
      seasonData = await tmdbService.getSeasonDetails(tv.id, num);
    } catch (e) {
      console.error("Failed to load season", e);
    } finally {
      loadingEpisodes = false;
    }
  };

  $: if (selectedSeason && tv) {
    loadSeason(selectedSeason);
  }

  const unsubscribe = tvId.subscribe((id) => {
    load(id);
  });

  onMount(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!seasonPickerOpen) return;
      if (seasonPickerEl && t && !seasonPickerEl.contains(t)) seasonPickerOpen = false;
    };
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      unsubscribe();
    };
  });
</script>

{#if loading}
  <div class="flex h-[600px] items-center justify-center">
    <div
      class="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"
    ></div>
  </div>
{:else if error}
  <div
    class="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-200"
  >
    <p class="text-lg font-semibold">{error}</p>
    <button
      on:click={() => load($tvId)}
      class="mt-4 text-sm font-bold underline">Try again</button
    >
  </div>
{:else if tv}
  <DetailLayout item={tv} type="tv" bind:activeTab>
    <div slot="tab-content" let:activeTab>
      {#if activeTab === "episodes"}
        <div class="space-y-5">
          <!-- Season Selector -->
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="relative" bind:this={seasonPickerEl}>
              <button
                type="button"
                class="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                aria-haspopup="listbox"
                aria-expanded={seasonPickerOpen}
                on:click={() => (seasonPickerOpen = !seasonPickerOpen)}
              >
                <span class="text-white/80">{getSeasonLabel(selectedSeason)}</span>
                <ChevronDown
                  size={16}
                  class={`text-white/40 transition-transform ${seasonPickerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {#if seasonPickerOpen}
                <div
                  class="absolute left-0 top-[calc(100%+10px)] z-30 w-[320px] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl"
                  role="listbox"
                >
                  <div class="overscroll-contain max-h-[340px] overflow-auto p-2">
                    {#each tv.seasons as s}
                      {@const isActive = Number(s.season_number) === Number(selectedSeason)}
                      <button
                        type="button"
                        class={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                        on:click={() => {
                          selectedSeason = s.season_number;
                          seasonPickerOpen = false;
                        }}
                      >
                        <div class="min-w-0">
                          <div class="line-clamp-1">{s.name}</div>
                          <div class="mt-0.5 text-[11px] font-medium text-white/35">
                            {s.episode_count} episodes
                          </div>
                        </div>
                        {#if isActive}
                          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
                            <Check size={16} />
                          </div>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            {#if seasonData}
              <div class="text-xs text-white/40">
                {seasonData.episodes?.length || 0} episodes
              </div>
            {/if}
          </div>

          {#if loadingEpisodes}
            <div class="flex justify-center py-10">
              <div
                class="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"
              ></div>
            </div>
          {:else if seasonData}
            <div class="space-y-3">
              {#each seasonData.episodes as ep}
                <a
                  use:link
                  href={`/watch/tv/${tv.id}/${ep.season_number}/${ep.episode_number}`}
                  class="group block overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/5 transition-all duration-300 hover:bg-white/[0.06] hover:ring-yellow-400/20"
                >
                  <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                    <!-- Episode Thumbnail -->
                    <div
                      class="relative aspect-video w-full sm:w-40 flex-none overflow-hidden rounded-xl bg-zinc-800"
                    >
                      {#if ep.still_path}
                        <img
                          src={getImageUrl(ep.still_path, "w300")}
                          alt={ep.name}
                          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      {:else}
                        <div class="flex h-full w-full items-center justify-center bg-zinc-800">
                          <Play size={24} class="text-white/20" />
                        </div>
                      {/if}
                      <!-- Play overlay -->
                      <div
                        class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-400/30">
                          <Play size={18} fill="currentColor" />
                        </div>
                      </div>
                    </div>

                    <!-- Episode Info -->
                    <div class="flex flex-1 flex-col justify-center min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 whitespace-nowrap">
                              EP {ep.episode_number}
                            </span>
                            <h4 class="text-sm sm:text-base font-semibold text-white/90 group-hover:text-yellow-400 transition-colors line-clamp-1">
                              {ep.name}
                            </h4>
                          </div>

                          <!-- Episode metadata -->
                          <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/40">
                            {#if ep.air_date}
                              <span class="flex items-center gap-1">
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span class="h-1 w-1 rounded-full bg-white/20"></span>
                            {/if}
                            {#if ep.runtime}
                              <span>{ep.runtime} min</span>
                              <span class="h-1 w-1 rounded-full bg-white/20"></span>
                            {/if}
                            {#if ep.vote_average}
                              <span class="text-yellow-400">★ {ep.vote_average.toFixed(1)}</span>
                            {/if}
                          </div>
                        </div>
                      </div>

                      <!-- Overview -->
                      {#if ep.overview}
                        <p class="mt-2 line-clamp-2 text-[11px] sm:text-xs text-white/40 leading-relaxed">
                          {ep.overview}
                        </p>
                      {/if}
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === "casts"}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {#each cast as person}
            <div class="group flex flex-col items-center gap-2 text-center p-3 rounded-2xl bg-white/[0.02] ring-1 ring-white/5 transition-all duration-300 hover:bg-white/[0.04] hover:ring-yellow-400/20">
              <div
                class="h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-yellow-400/30"
              >
                {#if person.profile_path}
                  <img
                    src={getImageUrl(person.profile_path, "w185")}
                    alt={person.name}
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center bg-zinc-800 text-white/20">
                    <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                {/if}
              </div>
              <div class="text-[11px] font-bold text-white/90 leading-tight">
                {person.name}
              </div>
              <div class="text-[10px] text-white/40 leading-tight">
                {person.character}
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === "reviews"}
        <div class="space-y-4">
          {#each reviews as review}
            <div class="space-y-3 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 transition-all duration-300 hover:bg-white/[0.05] hover:ring-white/10">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold">
                    {review.author?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div class="font-bold text-white/90 text-xs">
                    {review.author}
                  </div>
                </div>
                {#if review.author_details?.rating}
                  <div
                    class="rounded-lg bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold text-yellow-400 ring-1 ring-yellow-400/20"
                  >
                    ★ {review.author_details.rating}/10
                  </div>
                {/if}
              </div>
              <p class="text-[12px] text-white/60 leading-relaxed line-clamp-4">
                {review.content}
              </p>
              {#if review.created_at}
                <div class="text-[10px] text-white/30">
                  {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              {/if}
            </div>
          {:else}
            <div class="py-16 text-center">
              <div class="text-white/20 text-4xl mb-3">💬</div>
              <div class="text-xs text-white/40">No reviews yet</div>
            </div>
          {/each}
        </div>
      {:else if activeTab === "related"}
        <div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {#each related as item}
            <MediaCard
              title={item.name}
              posterPath={item.poster_path}
              href={`/tv/${item.id}`}
              meta={item.first_air_date ? item.first_air_date.slice(0, 4) : null}
            />
          {/each}
        </div>
      {/if}
    </div>
  </DetailLayout>
{/if}
