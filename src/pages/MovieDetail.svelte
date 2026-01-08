<script lang="ts">
  import { derived } from "svelte/store";
  import { params, link } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { tmdbService, getImageUrl } from "../services/tmdb";
  import type { MovieDetails } from "../types";
  import DetailLayout from "../components/DetailLayout.svelte";
  import MediaCard from "../components/MediaCard.svelte";
  import { Play } from "lucide-svelte";

  const movieId = derived(params, ($p) => Number(($p as any)?.id));

  let movie: MovieDetails | null = null;
  let cast: any[] = [];
  let reviews: any[] = [];
  let related: any[] = [];
  let loading = true;
  let error: string | null = null;
  let activeTab = "overview";

  const load = async (id: number) => {
    if (!id) return;
    loading = true;
    error = null;
    try {
      const [details, credits, reviewsRes, recommendations] = await Promise.all(
        [
          tmdbService.getMovieDetails(id),
          tmdbService.getMovieCredits(id),
          tmdbService.getMovieReviews(id),
          tmdbService.getMovieRecommendations(id),
        ],
      );
      movie = details;
      cast = credits.cast.slice(0, 20);
      reviews = reviewsRes.results.slice(0, 10);
      related = recommendations.results.slice(0, 20);
    } catch (e: any) {
      error = e?.message ?? "Failed to load movie";
    } finally {
      loading = false;
    }
  };

  const unsubscribe = movieId.subscribe((id) => {
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
      on:click={() => load($movieId)}
      class="mt-4 text-sm font-bold underline">Try again</button
    >
  </div>
{:else if movie}
  <DetailLayout item={movie} type="movie" bind:activeTab>
    <div slot="tab-content" let:activeTab>
      {#if activeTab === "casts"}
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
              title={item.title}
              posterPath={item.poster_path}
              href={`/movie/${item.id}`}
              meta={item.release_date ? item.release_date.slice(0, 4) : null}
            />
          {/each}
        </div>
      {/if}
    </div>
  </DetailLayout>
{/if}
