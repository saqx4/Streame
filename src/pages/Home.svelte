<script lang="ts">
  import { onMount } from "svelte";
  import { tmdbService, getBackdropUrl, getPosterUrl } from "../services/tmdb";
  import type { Movie, TVShow } from "../types";
  import SectionCarousel from "../components/SectionCarousel.svelte";
  import Hero from "../components/Hero.svelte";
  import ContinueWatching from "../components/ContinueWatching.svelte";
  import { link } from "svelte-spa-router";

  let loading = true;

  type Item = {
    id: number;
    title: string;
    posterPath: string | null;
    href: string;
    meta?: string | null;
  };

  const platforms = [
    "Netflix",
    "Prime",
    "Max",
    "Star+",
    "Disney+",
    "Paramount+",
    "Apple Tv",
  ];

  let trendingMovies: Item[] = [];
  let trendingTV: Item[] = [];
  let topRatedMovies: Item[] = [];
  let topRatedTV: Item[] = [];
  let popularMovies: Item[] = [];
  let popularTV: Item[] = [];
  let actionMovies: Item[] = [];
  let comedyMovies: Item[] = [];
  let dramaMovies: Item[] = [];
  let horrorMovies: Item[] = [];
  let romanceMovies: Item[] = [];
  let sciFiMovies: Item[] = [];
  let documentaries: Item[] = [];
  let animationMovies: Item[] = [];

  let heroItems: any[] = [];

  const mapMovies = (items: Movie[]): Item[] =>
    items.map((m) => ({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path,
      href: `/movie/${m.id}`,
      meta: m.release_date ? m.release_date.slice(0, 4) : null,
    }));

  const mapTV = (items: TVShow[]): Item[] =>
    items.map((t) => ({
      id: t.id,
      title: t.name,
      posterPath: t.poster_path,
      href: `/tv/${t.id}`,
      meta: t.first_air_date ? t.first_air_date.slice(0, 4) : null,
    }));

  onMount(async () => {
    loading = true;
    try {
      const [
        trendingMoviesRes,
        trendingTVRes,
        topRatedMoviesRes,
        topRatedTVRes,
        popularMoviesRes,
        popularTVRes,
        actionRes,
        comedyRes,
        dramaRes,
        horrorRes,
        romanceRes,
        sciFiRes,
        docRes,
        animationRes,
        trendingAllRes,
      ] = await Promise.all([
        tmdbService.getTrendingMovies("week"),
        tmdbService.getTrendingTVShows("week"),
        tmdbService.getTopRatedMovies(1),
        tmdbService.getTopRatedTVShows(1),
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1),
        tmdbService.discoverMovies(1, { genre: 28 }),
        tmdbService.discoverMovies(1, { genre: 35 }),
        tmdbService.discoverMovies(1, { genre: 18 }),
        tmdbService.discoverMovies(1, { genre: 27 }),
        tmdbService.discoverMovies(1, { genre: 10749 }),
        tmdbService.discoverMovies(1, { genre: 878 }),
        tmdbService.discoverMovies(1, { genre: 99 }),
        tmdbService.discoverMovies(1, { genre: 16 }),
        tmdbService.getTrendingAll("week"),
      ]);

      trendingMovies = mapMovies(trendingMoviesRes.results);
      trendingTV = mapTV(trendingTVRes.results);
      topRatedMovies = mapMovies(topRatedMoviesRes.results);
      topRatedTV = mapTV(topRatedTVRes.results);
      popularMovies = mapMovies(popularMoviesRes.results);
      popularTV = mapTV(popularTVRes.results);
      actionMovies = mapMovies(actionRes.results);
      comedyMovies = mapMovies(comedyRes.results);
      dramaMovies = mapMovies(dramaRes.results);
      horrorMovies = mapMovies(horrorRes.results);
      romanceMovies = mapMovies(romanceRes.results);
      sciFiMovies = mapMovies(sciFiRes.results);
      documentaries = mapMovies(docRes.results);
      animationMovies = mapMovies(animationRes.results);

      const mixed = trendingAllRes.results;
      heroItems = mixed
        .filter(
          (x: any) =>
            (x?.backdrop_path || x?.poster_path) && (x?.title || x?.name),
        )
        .slice(0, 10)
        .map((x: any) => {
          const isMovie = Boolean(x.title);
          return {
            id: x.id,
            type: isMovie ? "movie" : "tv",
            title: isMovie ? x.title : x.name,
            backdropPath: x.backdrop_path ?? null,
            posterPath: x.poster_path ?? null,
            meta: isMovie
              ? x.release_date
                ? String(x.release_date).slice(0, 4)
                : null
              : x.first_air_date
                ? String(x.first_air_date).slice(0, 4)
                : null,
          };
        });
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-10 pb-6">
  {#if loading}
    <div
      class="flex h-[400px] items-center justify-center rounded-3xl bg-zinc-900/50"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400/30 border-t-yellow-400"
        ></div>
        <p class="text-sm text-white/50">Loading content...</p>
      </div>
    </div>
  {:else if heroItems.length}
    <Hero items={heroItems} />
  {/if}

  <ContinueWatching />

  <SectionCarousel title="Trending Movies" items={trendingMovies} {loading} />
  <SectionCarousel title="Trending TV Shows" items={trendingTV} {loading} />
  <SectionCarousel title="Top Rated Movies" items={topRatedMovies} {loading} />
  <SectionCarousel title="Top Rated TV Shows" items={topRatedTV} {loading} />
  <SectionCarousel title="Popular Movies" items={popularMovies} {loading} />
  <SectionCarousel title="Popular TV Shows" items={popularTV} {loading} />
  <SectionCarousel title="Action Movies" items={actionMovies} {loading} />
  <SectionCarousel title="Comedy Movies" items={comedyMovies} {loading} />
  <SectionCarousel title="Drama Movies" items={dramaMovies} {loading} />
  <SectionCarousel title="Horror Movies" items={horrorMovies} {loading} />
  <SectionCarousel title="Romance Movies" items={romanceMovies} {loading} />
  <SectionCarousel title="Sci-Fi Movies" items={sciFiMovies} {loading} />
  <SectionCarousel title="Documentaries" items={documentaries} {loading} />
  <SectionCarousel title="Animation Movies" items={animationMovies} {loading} />
</section>
