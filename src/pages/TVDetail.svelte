<script lang="ts">
  import { derived } from "svelte/store";
  import { params, link } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { tmdbService, getImageUrl } from "../services/tmdb";
  import type { TVShowDetails } from "../types";
  import DetailLayout from "../components/DetailLayout.svelte";
  import MediaCard from "../components/MediaCard.svelte";
  import { Play } from "lucide-svelte";

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
    return () => unsubscribe();
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
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <select
              bind:value={selectedSeason}
              class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {#each tv.seasons as s}
                <option value={s.season_number}>
                  {s.name} ({s.episode_count})
                </option>
              {/each}
            </select>
          </div>

          {#if loadingEpisodes}
            <div class="flex justify-center py-10">
              <div
                class="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"
              ></div>
            </div>
          {:else if seasonData}
            <div class="grid gap-4">
              {#each seasonData.episodes as ep}
                <div
                  class="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div class="flex gap-4">
                    <div
                      class="relative aspect-video w-32 flex-none overflow-hidden rounded-lg"
                    >
                      <img
                        src={getImageUrl(ep.still_path, "w300")}
                        alt={ep.name}
                        class="h-full w-full object-cover"
                      />
                      <div
                        class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Play size={24} fill="white" class="text-white" />
                      </div>
                    </div>
                    <div class="flex flex-1 flex-col justify-center">
                      <div class="text-[13px] font-bold text-white/90">
                        EP {ep.episode_number} : {ep.name}
                      </div>
                      <div class="mt-1 text-xs text-white/50">
                        {ep.vote_average ? ep.vote_average.toFixed(1) : "—"} • {ep.runtime
                          ? `${ep.runtime}min`
                          : "—"}
                      </div>
                      <a
                        use:link
                        href={`/watch/tv/${tv.id}/${ep.season_number}/${ep.episode_number}`}
                        class="mt-3 flex h-8 w-fit items-center gap-2 rounded-lg bg-yellow-400 px-4 text-[11px] font-black text-black shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform"
                      >
                        <Play size={12} fill="currentColor" />
                        Watch
                      </a>
                    </div>
                  </div>
                  <p
                    class="mt-3 line-clamp-2 text-xs text-white/40 leading-relaxed"
                  >
                    {ep.overview || "No overview available for this episode."}
                  </p>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === "casts"}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {#each cast as person}
            <div class="flex flex-col items-center gap-2 text-center">
              <div
                class="h-20 w-20 overflow-hidden rounded-full ring-1 ring-white/10"
              >
                <img
                  src={getImageUrl(person.profile_path, "w185")}
                  alt={person.name}
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="text-[11px] font-bold text-white/90 leading-tight">
                {person.name}
              </div>
              <div class="text-[10px] text-white/50 leading-tight">
                {person.character}
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === "reviews"}
        <div class="space-y-6">
          {#each reviews as review}
            <div class="space-y-2 rounded-2xl bg-white/5 p-4">
              <div class="flex items-center gap-2">
                <div class="font-bold text-white/90 text-xs">
                  {review.author}
                </div>
                {#if review.author_details?.rating}
                  <div
                    class="rounded-lg bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400"
                  >
                    {review.author_details.rating}
                  </div>
                {/if}
              </div>
              <p class="text-[11px] text-white/60 leading-relaxed line-clamp-4">
                {review.content}
              </p>
            </div>
          {:else}
            <div class="py-10 text-center text-xs text-white/40">
              No reviews yet.
            </div>
          {/each}
        </div>
      {:else if activeTab === "related"}
        <div class="grid grid-cols-2 gap-x-4 gap-y-6">
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
