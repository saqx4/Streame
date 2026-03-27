<script lang="ts">
  import { derived } from "svelte/store";
  import { params, link } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { tmdbService, getImageUrl } from "../services/tmdb";
  import type { TVShowDetails } from "../types";
  import DetailLayout from "../components/DetailLayout.svelte";
  import MediaCard from "../components/MediaCard.svelte";
  import { Play, ChevronDown, Check, Star, ChevronLeft, ChevronRight } from "lucide-svelte";

  const tvId = derived(params, ($p) => Number(($p as any)?.id));

  let tv: TVShowDetails | null = null;
  let cast: any[] = [];
  let reviews: any[] = [];
  let related: any[] = [];
  let seasonData: any = null;
  let selectedSeason = 1;
  let loading = true;
  let loadingEpisodes = false;
  let error: string | null = null;
  let activeTab = "episodes";

  let epScroller: HTMLDivElement | null = null;

  const scrollEpisodes = (dir: -1 | 1) => {
    if (!epScroller) return;
    epScroller.scrollBy({ left: dir * 600, behavior: "smooth" });
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
    return () => {
      unsubscribe();
    };
  });
</script>

{#if loading}
  <div class="flex h-[600px] items-center justify-center">
    <div
      class="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
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
        <div class="space-y-8">
          <!-- New Season Selector Design (Horizontal Pills) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white/30">Select Season</h3>
              {#if seasonData}
                <span class="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded-md">
                  {seasonData.episodes?.length || 0} Episodes
                </span>
              {/if}
            </div>
            
            <div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
              {#each tv.seasons as s}
                {@const isActive = Number(s.season_number) === Number(selectedSeason)}
                <button
                  type="button"
                  class={`shrink-0 rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    isActive
                      ? "bg-accent text-black border-accent shadow-[0_8px_20px_rgba(250,204,21,0.3)]"
                      : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10"
                  }`}
                  on:click={() => (selectedSeason = s.season_number)}
                >
                  Season {s.season_number}
                </button>
              {/each}
            </div>
          </div>

          {#if loadingEpisodes}
            <div class="flex justify-center py-20">
              <div
                class="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent"
              ></div>
            </div>
          {:else if seasonData}
            <!-- Horizontal Episode Row with Navigation Arrows -->
            <div class="relative group/episodes">
              <!-- Navigation Arrows -->
              <div class="absolute -top-12 right-2 flex items-center gap-2">
                <button
                  class="group flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 ring-1 ring-white/10 transition-all hover:bg-accent hover:text-black hover:ring-accent active:scale-90"
                  on:click={() => scrollEpisodes(-1)}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} class="transition-transform group-hover:-translate-x-0.5" />
                </button>
                <button
                  class="group flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 ring-1 ring-white/10 transition-all hover:bg-accent hover:text-black hover:ring-accent active:scale-90"
                  on:click={() => scrollEpisodes(1)}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} class="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div 
                bind:this={epScroller}
                class="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar scroll-smooth px-1"
              >
                {#each seasonData.episodes as ep}
                  <a
                    use:link
                    href={`/watch/tv/${tv.id}/${ep.season_number}/${ep.episode_number}`}
                    class="group relative w-[240px] sm:w-[280px] shrink-0 block transition-transform duration-500 hover:scale-[1.02]"
                  >
                    <!-- Episode Thumbnail Stage -->
                    <div class="relative aspect-video overflow-hidden rounded-[24px] bg-white/[0.02] border border-white/5 transition-all duration-500 group-hover:border-accent/30 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                      {#if ep.still_path}
                        <img
                          src={getImageUrl(ep.still_path, "w500")}
                          alt={ep.name}
                          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      {:else}
                        <div class="flex h-full w-full items-center justify-center bg-zinc-900">
                          <Play size={32} class="text-white/10" />
                        </div>
                      {/if}
                      
                      <!-- Overlay Scrims -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-500"></div>
                      
                      <!-- Play Indicator -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-2xl shadow-accent/40">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>

                      <!-- EP Number Tag -->
                      <div class="absolute top-4 left-4 rounded-xl bg-black/60 px-3 py-1.5 text-[10px] font-black text-accent backdrop-blur-md border border-white/10">
                        EP {ep.episode_number}
                      </div>

                      <!-- Runtime Tag -->
                      {#if ep.runtime}
                        <div class="absolute bottom-4 right-4 rounded-xl bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur-md border border-white/5">
                          {ep.runtime}m
                        </div>
                      {/if}
                    </div>

                    <!-- Episode Content Info -->
                    <div class="mt-5 space-y-2 px-2">
                      <div class="flex items-start justify-between gap-3">
                        <h4 class="text-lg font-black text-white group-hover:text-accent transition-colors line-clamp-1">
                          {ep.name}
                        </h4>
                        {#if ep.vote_average}
                          <div class="flex items-center gap-1.5 text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20">
                            <Star size={10} fill="currentColor" />
                            <span class="text-[10px] font-black">{ep.vote_average.toFixed(1)}</span>
                          </div>
                        {/if}
                      </div>
                      
                      {#if ep.overview}
                        <p class="text-xs text-white/40 leading-relaxed line-clamp-2 min-h-[32px] group-hover:text-white/60 transition-colors">
                          {ep.overview}
                        </p>
                      {/if}

                      <div class="pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/10 group-hover:text-accent/30 transition-colors">
                        {#if ep.air_date}
                          {new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {/if}
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
              
              <!-- Edge Fades removed based on user feedback -->
            </div>
          {/if}
        </div>
      {:else if activeTab === "casts"}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {#each cast as person}
            <div class="group flex flex-col items-center gap-3 text-center p-4 rounded-3xl bg-white/[0.02] border border-white/5 transition-all duration-500 hover:bg-white/[0.05] hover:border-accent/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1">
              <div
                class="h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/5 transition-all duration-500 group-hover:ring-accent/40 shadow-xl"
              >
                {#if person.profile_path}
                  <img
                    src={getImageUrl(person.profile_path, "w185")}
                    alt={person.name}
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center bg-zinc-800 text-white/10">
                    <svg class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                {/if}
              </div>
              <div class="space-y-1">
                <div class="text-[13px] font-bold text-white/90 leading-tight group-hover:text-accent transition-colors">
                  {person.name}
                </div>
                <div class="text-[11px] font-medium text-white/30 leading-tight">
                  {person.character}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === "reviews"}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each reviews as review}
            <div class="group relative space-y-4 rounded-3xl bg-white/[0.02] border border-white/5 p-6 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-2xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-black text-sm font-black shadow-lg shadow-accent/20">
                    {review.author?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div class="font-bold text-white/90 text-sm">
                      {review.author}
                    </div>
                    {#if review.created_at}
                      <div class="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    {/if}
                  </div>
                </div>
                {#if review.author_details?.rating}
                  <div
                    class="rounded-xl bg-accent/10 px-3 py-1.5 text-[11px] font-black text-accent border border-accent/20"
                  >
                    ★ {review.author_details.rating}
                  </div>
                {/if}
              </div>
              <p class="text-[13px] text-white/50 leading-relaxed line-clamp-6 group-hover:text-white/70 transition-colors">
                {review.content}
              </p>
            </div>
          {:else}
            <div class="col-span-full py-24 text-center">
              <div class="text-white/10 text-6xl mb-4">💬</div>
              <div class="text-sm font-bold text-white/30 uppercase tracking-[0.2em]">No reviews yet</div>
            </div>
          {/each}
        </div>
      {:else if activeTab === "related"}
        <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
          {#each related as item}
            <MediaCard
              class="w-full"
              title={item.name}
              posterPath={item.poster_path}
              backdropPath={item.backdrop_path}
              href={`/tv/${item.id}`}
              meta={item.first_air_date ? item.first_air_date.slice(0, 4) : null}
              rating={item.vote_average}
            />
          {/each}
        </div>
      {/if}
    </div>
  </DetailLayout>
{/if}
