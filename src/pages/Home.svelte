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

  let latestMovies: Item[] = [];
  let latestTV: Item[] = [];
  let latestKDramas: Item[] = [];
  let latestAnime: Item[] = [];
  let latestManga: Item[] = [];
  let latestOnPlatforms: Item[] = [];

  let popularMovies: Item[] = [];
  let popularTV: Item[] = [];
  let popularKDramas: Item[] = [];
  let popularAnime: Item[] = [];
  let popularManga: Item[] = [];
  let popularOnPlatforms: Item[] = [];

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
        latestMoviesRes,
        latestTVRes,
        latestKDramasRes,
        latestAnimeRes,
        latestMangaRes,
        popularMoviesRes,
        popularTVRes,
        popularKDramasRes,
        popularAnimeRes,
        popularMangaRes,
        trendingAllRes,
      ] = await Promise.all([
        tmdbService.getUpcomingMovies(1),
        tmdbService.getOnTheAirTVShows(1),
        tmdbService.discoverTVShows(1, {
          language: "ko",
          genre: 18,
          sortBy: "first_air_date.desc",
        }),
        tmdbService.discoverTVShows(1, {
          language: "ja",
          genre: 16,
          sortBy: "first_air_date.desc",
        }),
        tmdbService.discoverMovies(1, {
          language: "ja",
          genre: 16,
          sortBy: "primary_release_date.desc",
        }),
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1),
        tmdbService.discoverTVShows(1, {
          language: "ko",
          genre: 18,
          sortBy: "popularity.desc",
        }),
        tmdbService.discoverTVShows(1, {
          language: "ja",
          genre: 16,
          sortBy: "popularity.desc",
        }),
        tmdbService.discoverMovies(1, {
          language: "ja",
          genre: 16,
          sortBy: "popularity.desc",
        }),
        tmdbService.getTrendingAll("week"),
      ]);

      latestMovies = mapMovies(latestMoviesRes.results);
      latestTV = mapTV(latestTVRes.results);
      latestKDramas = mapTV(latestKDramasRes.results);
      latestAnime = mapTV(latestAnimeRes.results);
      latestManga = mapMovies(latestMangaRes.results as any);

      popularMovies = mapMovies(popularMoviesRes.results);
      popularTV = mapTV(popularTVRes.results);
      popularKDramas = mapTV(popularKDramasRes.results);
      popularAnime = mapTV(popularAnimeRes.results);
      popularManga = mapMovies(popularMangaRes.results as any);

      // Platform sections (UI-driven): mix trending content to populate rows.
      const mixed = trendingAllRes.results;
      const mixedMovies = mixed.filter((x: any) => (x as any).title);
      const mixedTV = mixed.filter((x: any) => (x as any).name);
      latestOnPlatforms = [
        ...mapTV(mixedTV as any),
        ...mapMovies(mixedMovies as any),
      ].slice(0, 24);
      popularOnPlatforms = [...popularTV, ...popularMovies].slice(0, 24);

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

  <SectionCarousel title="Latest Movies" items={latestMovies} {loading} />
  <SectionCarousel title="Latest TV Shows" items={latestTV} {loading} />
  <SectionCarousel title="Latest K-Dramas" items={latestKDramas} {loading} />
  <SectionCarousel title="Latest Anime" items={latestAnime} {loading} />
  <SectionCarousel title="Latest Manga" items={latestManga} {loading} />

  <SectionCarousel
    title="Latest TV Shows Movies on Netflix Prime Max Star+ Disney+ Paramount+ Apple Tv"
    items={latestOnPlatforms}
    chips={platforms}
    {loading}
  />

  <SectionCarousel title="Popular Movies" items={popularMovies} {loading} />
  <SectionCarousel title="Popular TV Shows" items={popularTV} {loading} />
  <SectionCarousel title="Popular K-Dramas" items={popularKDramas} {loading} />
  <SectionCarousel title="Popular Anime" items={popularAnime} {loading} />
  <SectionCarousel title="Popular Manga" items={popularManga} {loading} />

  <SectionCarousel
    title="Popular TV Shows Movies on Netflix Prime Max Star+ Disney+ Paramount+ Apple Tv"
    items={popularOnPlatforms}
    chips={platforms}
    {loading}
  />
</section>
