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
