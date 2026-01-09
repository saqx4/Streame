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
    class="relative h-[450px] w-full overflow-hidden rounded-[40px] bg-zinc-950 ring-1 ring-white/10 sm:h-[550px]"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0">
      {#key current.id}
        {#if current.backdropPath}
          <img
            src={getBackdropUrl(current.backdropPath, "original")}
            alt={current.title}
            class="h-full w-full object-cover"
            in:fade={{ duration: 450 }}
            out:fade={{ duration: 350 }}
          />
        {/if}
      {/key}
      <!-- Gradients -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/80"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"
      ></div>
      <div class="absolute inset-0 bg-black/20"></div>
    </div>

    <!-- Content -->
    <div class="absolute inset-0 flex flex-col items-center justify-end pb-12">
      {#key current.id}
        <div
          class="flex flex-col items-center gap-6"
          in:fly={{ y: 10, duration: 420 }}
          out:fade={{ duration: 240 }}
        >
          <!-- Title/Logo Area -->
          <div
            class="flex h-24 items-center justify-center px-6 text-center sm:h-32"
          >
            {#if logoUrl}
              <img
                src={logoUrl}
                alt={current.title}
                class="max-h-full max-w-[280px] object-contain drop-shadow-2xl sm:max-w-[400px]"
              />
            {:else}
              <h2
                class="text-2xl font-extrabold text-white drop-shadow-lg sm:text-4xl lg:text-5xl"
              >
                {current.title}
              </h2>
            {/if}
          </div>

          <!-- Floating Control Bar -->
          <div
            class="flex items-center gap-1.5 rounded-[20px] bg-black/40 p-1.5 backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl sm:gap-2 sm:rounded-[24px] sm:p-2"
          >
            <a
              use:link
              {href}
              class="flex h-9 items-center gap-1.5 rounded-xl bg-yellow-400 px-3 text-xs font-black text-black shadow-lg shadow-yellow-400/20 transition-transform hover:scale-105 active:scale-95 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
            >
              <Play size={16} fill="currentColor" />
              Watch
            </a>

            <a
              use:link
              {href}
              class="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white/90 transition-transform hover:bg-white/10 active:scale-95 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
            >
              Details
            </a>

            <div class="h-5 w-px bg-white/10 mx-0.5 sm:h-6 sm:mx-1"></div>

            <button
              class={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 sm:h-11 sm:w-11 ${
                isInWatchlist
                  ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/15"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              } ${watchlistBusy ? "opacity-60" : ""}`}
              on:click={toggleWatchlist}
              aria-label="Toggle watchlist"
            >
              <Bookmark size={18} />
            </button>

            <button
              on:click={handleShare}
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 sm:h-11 sm:w-11"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      {/key}

      {#if heroItems().length > 1}
        <div class="mt-6 flex items-center gap-2">
          {#each heroItems() as it, i (it.id)}
            <button
              class={`h-2.5 w-2.5 rounded-full ring-1 ring-white/15 transition-all ${
                i === safeIndex
                  ? "bg-white/80"
                  : "bg-white/20 hover:bg-white/35"
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
