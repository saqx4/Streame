<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { Play, Info, Bookmark, Share2 } from "lucide-svelte";
  import { tmdbService, getBackdropUrl, getPosterUrl } from "../services/tmdb";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { userMediaService } from "../services/userMedia";
  import { redirectToLogin } from "../lib/loginRedirect";
  import { fade, fly } from "svelte/transition";

  type HeroItem = {
    id: number;
    type: "movie" | "tv";
    title: string;
    backdropPath: string | null;
    posterPath: string | null;
    meta: string | null;
  };

  export let items: HeroItem[] = [];
  export let item: HeroItem | null = null;

  let logoUrl: string | null = null;
  let loadingLogo = true;

  let index = 0;
  let timer: any = null;

  const LOCAL_WATCHLIST_KEY = "streame:watchlist";

  let userId: string | null = null;
  let isInWatchlist = false;
  let watchlistBusy = false;

  const heroItems = () => {
    if (items && items.length) return items;
    if (item) return [item];
    return [];
  };

  $: list = heroItems();
  $: safeIndex = list.length ? Math.min(index, list.length - 1) : 0;
  $: current = list.length ? list[safeIndex] : null;

  const getLocalWatchlist = (): any[] => {
    try {
      const raw = localStorage.getItem(LOCAL_WATCHLIST_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const setLocalWatchlist = (v: any[]) => {
    try {
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(v));
    } catch {
      // ignore
    }
  };

  const refreshWatchlistState = async () => {
    if (!current?.id) {
      isInWatchlist = false;
      userId = null;
      return;
    }

    try {
      if (isSupabaseEnabled) {
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id ?? null;
        if (userId) {
          isInWatchlist = await userMediaService.has(
            userId,
            current.id,
            "watchlist",
          );
          return;
        }
      } else {
        userId = null;
      }

      const local = getLocalWatchlist();
      isInWatchlist = local.some(
        (x) => Number(x?.tmdb_id) === Number(current.id),
      );
    } catch {
      isInWatchlist = false;
    }
  };

  const toggleWatchlist = async () => {
    if (!current?.id || watchlistBusy) return;

    if (isSupabaseEnabled && !userId) {
      redirectToLogin(window.location.hash || "#/");
      return;
    }

    watchlistBusy = true;
    try {
      if (userId) {
        if (isInWatchlist) {
          await userMediaService.remove(userId, current.id, "watchlist");
          isInWatchlist = false;
        } else {
          await userMediaService.add(
            userId,
            {
              tmdb_id: current.id,
              type: current.type,
              title: current.title,
              poster_path: current.posterPath,
            },
            "watchlist",
          );
          isInWatchlist = true;
        }
        return;
      }

      const local = getLocalWatchlist();
      const exists = local.some(
        (x) => Number(x?.tmdb_id) === Number(current.id),
      );
      const next = exists
        ? local.filter((x) => Number(x?.tmdb_id) !== Number(current.id))
        : [
            {
              tmdb_id: current.id,
              type: current.type,
              title: current.title,
              poster_path: current.posterPath,
            },
            ...local,
          ];
      setLocalWatchlist(next);
      isInWatchlist = !exists;
    } finally {
      watchlistBusy = false;
    }
  };

  $: if (current?.id) {
    loadLogo();
    refreshWatchlistState();
  }

  async function loadLogo() {
    loadingLogo = true;
    try {
      const res =
        current?.type === "movie"
          ? await tmdbService.getMovieImages(current.id)
          : await tmdbService.getTVShowImages(current!.id);

      const logo =
        res.logos.find((l: any) => l.iso_639_1 === "en") || res.logos[0];
      if (logo) {
        logoUrl = `https://image.tmdb.org/t/p/original${logo.file_path}`;
      } else {
        logoUrl = null;
      }
    } catch (e) {
      logoUrl = null;
    } finally {
      loadingLogo = false;
    }
  }

  $: href = current
    ? current.type === "movie"
      ? `/movie/${current.id}`
      : `/tv/${current.id}`
    : "/";

  const handleShare = async () => {
    if (!current) return;
    const shareData = {
      title: current.title,
      text: `Check out ${current.title} on Streame!`,
      url: window.location.origin + window.location.pathname + "#" + href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const startRotation = () => {
    const list = heroItems();
    if (timer) clearInterval(timer);
    if (list.length <= 1) return;
    timer = setInterval(() => {
      index = (index + 1) % list.length;
    }, 9000);
  };

  onMount(() => {
    startRotation();
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  $: if (items && items.length) {
    startRotation();
  }
</script>

{#if current}
  <div
    class="relative h-[450px] w-full overflow-hidden rounded-[40px] bg-zinc-950 ring-1 ring-white/5 sm:h-[550px]"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0">
      {#key current.id}
        {#if current.backdropPath}
          <img
            src={getBackdropUrl(current.backdropPath, "original")}
            alt={current.title}
            class="h-full w-full object-cover scale-105"
            in:fade={{ duration: 600 }}
            out:fade={{ duration: 400 }}
          />
        {/if}
      {/key}
      <!-- Enhanced Gradients -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black"></div>
      <!-- Radial vignette -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_100%)] opacity-40"></div>
      <!-- Noise texture overlay -->
      <div class="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]"></div>
    </div>

    <!-- Content -->
    <div class="absolute inset-0 flex flex-col items-center justify-end pb-12">
      {#key current.id}
        <div
          class="flex flex-col items-center gap-6"
          in:fly={{ y: 20, duration: 500 }}
          out:fade={{ duration: 300 }}
        >
          <!-- Title/Logo Area -->
          <div
            class="flex h-24 items-center justify-center px-6 text-center sm:h-32"
          >
            {#if logoUrl}
              <img
                src={logoUrl}
                alt={current.title}
                class="max-h-full max-w-[280px] object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] sm:max-w-[400px]"
              />
            {:else}
              <h2
                class="text-2xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-4xl lg:text-5xl"
              >
                {current.title}
              </h2>
            {/if}
          </div>

          <!-- Floating Control Bar -->
          <div
            class="flex items-center gap-1.5 rounded-[24px] bg-black/50 p-1.5 backdrop-blur-3xl ring-1 ring-white/10 shadow-2xl shadow-black/50 sm:gap-2 sm:rounded-[28px] sm:p-2"
          >
            <a
              use:link
              {href}
              class="group flex h-9 items-center gap-1.5 rounded-xl bg-yellow-400 px-4 text-xs font-black text-black shadow-lg shadow-yellow-400/30 transition-all hover:shadow-yellow-400/50 hover:scale-105 active:scale-95 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
            >
              <Play size={16} fill="currentColor" class="transition-transform group-hover:translate-x-0.5" />
              Watch
            </a>

            <a
              use:link
              {href}
              class="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white/90 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
            >
              Details
            </a>

            <div class="h-5 w-px bg-white/10 mx-0.5 sm:h-6 sm:mx-1"></div>

            <button
              class={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 sm:h-11 sm:w-11 ${
                isInWatchlist
                  ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-300 hover:bg-yellow-400/25"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
              } ${watchlistBusy ? "opacity-60" : ""}`}
              on:click={toggleWatchlist}
              aria-label="Toggle watchlist"
            >
              <Bookmark size={18} />
            </button>

            <button
              on:click={handleShare}
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all active:scale-95 sm:h-11 sm:w-11"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      {/key}

      {#if heroItems().length > 1}
        <div class="mt-8 flex items-center gap-2">
          {#each heroItems() as it, i (it.id)}
            <button
              class={`h-2 rounded-full transition-all duration-300 ${
                i === safeIndex
                  ? "w-8 bg-yellow-400 shadow-lg shadow-yellow-400/30"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              on:click={() => (index = i)}
              aria-label={`Hero item ${i + 1}`}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Optional: add some animations or specific styles if needed */
</style>
