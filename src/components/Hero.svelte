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
    class="relative h-[400px] w-full overflow-hidden rounded-[40px] bg-zinc-950 ring-1 ring-white/10 sm:h-[500px] animate-in"
  >
    <!-- Backdrop with Parallax-like effect -->
    <div class="absolute inset-0 overflow-hidden">
      {#key current.id}
        {#if current.backdropPath}
          <img
            src={getBackdropUrl(current.backdropPath, "original")}
            alt={current.title}
            class="h-full w-full object-cover scale-110 motion-safe:animate-[mesh_30s_ease-in-out_infinite]"
            in:fade={{ duration: 1000 }}
            out:fade={{ duration: 800 }}
          />
        {/if}
      {/key}
      <!-- Enhanced Multi-layer Gradients -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-[#050505]"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505]"></div>
      
      <!-- Subtle Texture Overlay -->
      <div class="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
    </div>

    <!-- Content -->
    <div class="absolute inset-0 flex flex-col items-center justify-end pb-12">
      {#key current.id}
        <div
          class="flex flex-col items-center gap-6"
          in:fly={{ y: 20, duration: 800, delay: 200 }}
          out:fade={{ duration: 400 }}
        >
          <!-- Title/Logo Area -->
          <div
            class="flex h-24 items-center justify-center px-8 text-center sm:h-32"
          >
            {#if logoUrl}
              <img
                src={logoUrl}
                alt={current.title}
                class="max-h-full max-w-[320px] object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:max-w-[500px] float"
              />
            {:else}
              <h2
                class="text-3xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-6xl tracking-tighter"
              >
                {current.title}
              </h2>
            {/if}
          </div>

          <!-- Floating Premium Control Bar -->
          <div
            class="flex items-center gap-2 rounded-[28px] bg-white/[0.03] p-1.5 backdrop-blur-3xl ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,20,0,0.5)] sm:gap-2.5 sm:p-2 flex-wrap justify-center"
          >
            <a
              use:link
              {href}
              class="group flex h-9 items-center gap-2 rounded-[16px] bg-white px-5 text-xs font-black text-black transition-all hover:bg-accent hover:scale-105 active:scale-95 sm:h-12 sm:gap-2.5 sm:px-7 sm:text-sm whitespace-nowrap"
            >
              <Play size={18} fill="currentColor" class="transition-transform group-hover:translate-x-1" />
              Watch Now
            </a>

            <a
              use:link
              {href}
              class="flex h-9 items-center gap-2 rounded-[16px] border border-white/10 bg-white/5 px-5 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 sm:h-12 sm:gap-2.5 sm:px-7 sm:text-sm whitespace-nowrap"
            >
              <Info size={18} />
              Details
            </a>

            <div class="h-5 w-px bg-white/10 mx-0.5 sm:h-7 hidden xs:block"></div>

            <div class="flex items-center gap-2">
              <button
                class={`flex h-9 w-9 items-center justify-center rounded-[14px] border transition-all active:scale-95 sm:h-12 sm:w-12 ${
                  isInWatchlist
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20"
                } ${watchlistBusy ? "opacity-60" : ""}`}
                on:click={toggleWatchlist}
              >
                <Bookmark size={20} fill={isInWatchlist ? "currentColor" : "none"} />
              </button>

              <button
                on:click={handleShare}
                class="flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 transition-all active:scale-95 sm:h-12 sm:w-12"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      {/key}

      <!-- Indicators -->
      {#if heroItems().length > 1}
        <div class="mt-10 flex items-center gap-3">
          {#each heroItems() as it, i (it.id)}
            <button
              class={`h-1.5 rounded-full transition-all duration-500 ${
                i === safeIndex
                  ? "w-10 bg-accent shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                  : "w-3 bg-white/10 hover:bg-white/30"
              }`}
              on:click={() => (index = i)}
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
