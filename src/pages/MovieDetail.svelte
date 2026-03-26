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
              title={item.title}
              posterPath={item.poster_path}
              backdropPath={item.backdrop_path}
              href={`/movie/${item.id}`}
              meta={item.release_date ? item.release_date.slice(0, 4) : null}
              rating={item.vote_average}
            />
          {/each}
        </div>
      {/if}
    </div>
  </DetailLayout>
{/if}
