<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import { params, push } from "svelte-spa-router";
  import { getStreamingUrl, tmdbService } from "../services/tmdb";
  import {
    playerServerOptions,
    type PlayerServerKey,
    isPlayerServerKey,
  } from "../services/playerServers";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { watchHistoryService } from "../services/watchHistory";
  import { ArrowLeft, ChevronLeft, ChevronRight, Server, ExternalLink, RefreshCw } from "lucide-svelte";

  type RouteParams = {
    type?: "movie" | "tv";
    id?: string;
    season?: string;
    episode?: string;
  };

  const route = derived(params, ($p) => $p as unknown as RouteParams);

  const PER_TITLE_SERVER_PREFIX = "streame:lastServer";

  let preferredServer: PlayerServerKey = "server7";
  let startAtFromQuery: number | undefined = undefined;
  let serverFromQuery: PlayerServerKey | undefined = undefined;

  let userId: string | null = null;
  let title: string | null = null;
  let posterPath: string | null = null;
  let durationSeconds: number | null = null;

  let lastOpenedKey = "";

  let metaKey = "";
  let metaReq = 0;

  let authSub: any = null;

  let iframeLoaded = false;
  let iframeTimedOut = false;
  let iframeTimeoutId: any = null;

  const getPerTitleServerStorageKey = () => {
    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) return null;
    if (mediaType === "tv") {
      const s =
        typeof seasonNumber === "number" && seasonNumber > 0 ? seasonNumber : 1;
      const e =
        typeof episodeNumber === "number" && episodeNumber > 0
          ? episodeNumber
          : 1;
      return `${PER_TITLE_SERVER_PREFIX}:${mediaType}:${tmdbId}:${s}:${e}`;
    }
    return `${PER_TITLE_SERVER_PREFIX}:${mediaType}:${tmdbId}`;
  };

  const readPerTitleServer = () => {
    const key = getPerTitleServerStorageKey();
    if (!key) return undefined;
    try {
      const v = localStorage.getItem(key);
      return v && isPlayerServerKey(v) ? (v as PlayerServerKey) : undefined;
    } catch {
      return undefined;
    }
  };

  const savePerTitleServer = (id: PlayerServerKey) => {
    const key = getPerTitleServerStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, id);
    } catch {
      // ignore
    }
  };

  const savePreferredServer = (id: PlayerServerKey) => {
    preferredServer = id;
    savePerTitleServer(id);
  };

  const readQueryParams = () => {
    try {
      const hash = window.location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex === -1) {
        startAtFromQuery = undefined;
        serverFromQuery = undefined;
        return;
      }
      const query = hash.slice(qIndex + 1);
      const p = new URLSearchParams(query);
      const raw = p.get("startAt");
      const n = raw ? Number(raw) : NaN;
      startAtFromQuery =
        Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;

      const rawServer = p.get("server");
      serverFromQuery =
        rawServer && isPlayerServerKey(rawServer)
          ? (rawServer as PlayerServerKey)
          : undefined;
    } catch {
      startAtFromQuery = undefined;
      serverFromQuery = undefined;
    }
  };

  onMount(() => {
    readQueryParams();
    window.addEventListener("hashchange", readQueryParams);

    void loadUser();
    try {
      if (isSupabaseEnabled) {
        const { data } = supabase.auth.onAuthStateChange(() => {
          void loadUser();
        });
        authSub = data?.subscription ?? null;
      }
    } catch {
      authSub = null;
    }

  });

  onDestroy(() => {
    if (iframeTimeoutId) clearTimeout(iframeTimeoutId);
    try {
      authSub?.unsubscribe?.();
    } catch {
      // ignore
    }
    window.removeEventListener("hashchange", readQueryParams);
  });

  const cleanParam = (v?: string) => {
    if (!v) return undefined;
    const i = v.indexOf("?");
    return i === -1 ? v : v.slice(0, i);
  };

  $: p = (($route ?? {}) as unknown) as RouteParams;
  $: rawType = cleanParam(p.type);
  $: rawId = cleanParam(p.id);
  $: rawSeason = cleanParam(p.season);
  $: rawEpisode = cleanParam(p.episode);

  $: hasEpisodeInfo = rawSeason !== undefined && rawEpisode !== undefined;
  $: mediaType = (rawType === "tv" || hasEpisodeInfo
    ? "tv"
    : "movie") as unknown as "movie" | "tv";
  $: tmdbId = Number(rawId ?? 0);
  $: seasonNumber = rawSeason ? Number(rawSeason) : undefined;
  $: episodeNumber = rawEpisode ? Number(rawEpisode) : undefined;
  const recordOpened = async () => {
    if (!isSupabaseEnabled) return;
    if (!userId) return;
    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) return;
    if (!title) return;

    const k = `${mediaType}:${tmdbId}:${seasonNumber ?? ""}:${episodeNumber ?? ""}`;
    if (k === lastOpenedKey) return;
    lastOpenedKey = k;

    savePerTitleServer(preferredServer);

    await watchHistoryService.add(userId, {
      tmdb_id: tmdbId,
      type: mediaType,
      title,
      poster_path: posterPath ?? null,
      progress: 0,
      duration: null as any,
      last_position: null as any,
      season_number: mediaType === "tv" ? seasonNumber : undefined,
      episode_number: mediaType === "tv" ? episodeNumber : undefined,
      last_watched: new Date().toISOString(),
    });
  };

  const loadUser = async () => {
    if (!isSupabaseEnabled) {
      userId = null;
      return;
    }

    try {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
    } catch {
      userId = null;
    }
  };

  let seasonData: any = null;

  const loadMeta = async (key: string) => {
    const reqId = ++metaReq;

    title = null;
    posterPath = null;
    durationSeconds = null;
    seasonData = null;

    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) return;

    try {
      if (mediaType === "movie") {
        const details: any = await tmdbService.getMovieDetails(tmdbId);
        if (reqId !== metaReq || key !== metaKey) return;
        title = details?.title ?? null;
        posterPath = details?.poster_path ?? null;
        durationSeconds =
          typeof details?.runtime === "number" && details.runtime > 0
            ? details.runtime * 60
            : null;
      } else {
        const details: any = await tmdbService.getTVShowDetails(tmdbId);
        if (reqId !== metaReq || key !== metaKey) return;
        title = details?.name ?? null;
        posterPath = details?.poster_path ?? null;

        if (
          typeof seasonNumber === "number" &&
          seasonNumber > 0 &&
          typeof episodeNumber === "number" &&
          episodeNumber > 0
        ) {
          const season: any = await tmdbService.getSeasonDetails(
            tmdbId,
            seasonNumber,
          );
          if (reqId !== metaReq || key !== metaKey) return;
          seasonData = season;
          const ep = Array.isArray(season?.episodes)
            ? season.episodes.find(
                (e: any) => e?.episode_number === episodeNumber,
              )
            : null;
          durationSeconds =
            typeof ep?.runtime === "number" && ep.runtime > 0
              ? ep.runtime * 60
              : null;
        } else {
          durationSeconds = null;
        }
      }
    } catch {
      // ignore
    }
  };

  $: nextEp = (mediaType === "tv" && seasonData && episodeNumber)
    ? (seasonData.episodes || []).find((e: any) => e.episode_number === episodeNumber + 1)
    : null;
  $: prevEp = (mediaType === "tv" && seasonData && episodeNumber)
    ? (seasonData.episodes || []).find((e: any) => e.episode_number === episodeNumber - 1)
    : null;

  const goBack = () => {
    if (tmdbId) {
      push(`/${mediaType}/${tmdbId}`);
    } else {
      window.history.back();
    }
  };

  const navigateToEpisode = (ep: number) => {
    push(`/watch/tv/${tmdbId}/${seasonNumber}/${ep}`);
  };

  const handleIframeLoad = () => {
    iframeLoaded = true;
    iframeTimedOut = false;
    if (iframeTimeoutId) clearTimeout(iframeTimeoutId);
  };

  const openInNewTab = () => {
    if (!streamUrl) return;
    window.open(streamUrl, "_blank", "noopener,noreferrer");
  };

  const tryNextServer = () => {
    const i = playerServerOptions.findIndex((s) => s.key === preferredServer);
    const next = playerServerOptions[(i >= 0 ? i + 1 : 0) % playerServerOptions.length]?.key;
    if (next) savePreferredServer(next);
  };

  $: streamUrl = tmdbId
    ? getStreamingUrl(
        tmdbId,
        mediaType,
        preferredServer,
        mediaType === "tv" ? seasonNumber : undefined,
        mediaType === "tv" ? episodeNumber : undefined,
        undefined,
      )
    : "";

  $: if (streamUrl) {
    iframeLoaded = false;
    iframeTimedOut = false;
    if (iframeTimeoutId) clearTimeout(iframeTimeoutId);
    iframeTimeoutId = setTimeout(() => {
      iframeTimedOut = true;
    }, 20_000);
  }

  let serverInitKey = "";
  let serverInitAppliedQuery = false;
  $: if (tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    const k = `${mediaType}:${tmdbId}:${seasonNumber ?? ""}:${episodeNumber ?? ""}`;
    if (k !== serverInitKey) {
      serverInitKey = k;
      serverInitAppliedQuery = false;
      const saved = readPerTitleServer();
      const target = serverFromQuery ?? saved;
      if (target) preferredServer = target;
      if (serverFromQuery) serverInitAppliedQuery = true;
    } else if (serverFromQuery && !serverInitAppliedQuery) {
      // Query params can be parsed after route params; always honor explicit server override.
      preferredServer = serverFromQuery;
      serverInitAppliedQuery = true;
    }
  }

  $: metaKey = `${mediaType}:${tmdbId}:${seasonNumber ?? ""}:${episodeNumber ?? ""}`;
  $: if (tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    void loadMeta(metaKey);
  }

  $: if (userId && title && tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    void recordOpened();
  }
</script>

<section class="max-w-[1200px] mx-auto space-y-6">
  <!-- Header / Navigation -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-4">
      <button 
        on:click={goBack}
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 active:scale-95"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <h1 class="text-xl font-bold tracking-tight sm:text-2xl">
          {title || 'Loading...'}
        </h1>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
            {mediaType}
          </span>
          {#if mediaType === 'tv' && seasonNumber && episodeNumber}
            <span class="text-sm text-white/50">
              Season {seasonNumber} • Episode {episodeNumber}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Server Selector -->
    <div class="relative group min-w-[180px]">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
        <Server size={14} />
      </div>
      <select
        class="w-full appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-10 text-sm font-medium text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
        value={preferredServer}
        on:change={(e) => {
          const val = e.currentTarget.value;
          if (isPlayerServerKey(val)) savePreferredServer(val);
        }}
      >
        {#each playerServerOptions as s}
          <option value={s.key} class="bg-zinc-900 text-white">
            {s.label}
          </option>
        {/each}
      </select>
      <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/40">
        <ChevronRight size={14} class="rotate-90" />
      </div>
    </div>
  </div>

  {#if !tmdbId}
    <div class="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5 text-center">
      <div class="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
        <ExternalLink size={24} />
      </div>
      <h3 class="text-lg font-semibold text-white">Invalid Media</h3>
      <p class="text-sm text-white/50 mt-1">We couldn't find the content you're looking for.</p>
    </div>
  {:else}
    <div class="relative group">
      <!-- Player Container -->
      <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl transition-all duration-500">
        <div class="relative aspect-video">
          {#if !iframeLoaded}
            <div class="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
              <div class="flex flex-col items-center gap-5 px-6 text-center">
                <div class="relative h-16 w-16">
                  <div class="absolute inset-0 rounded-full border-4 border-yellow-400/20"></div>
                  <div class="absolute inset-0 rounded-full border-4 border-t-yellow-400 animate-spin"></div>
                </div>
                <div class="space-y-1">
                  <p class="font-medium text-white">Preparing Stream</p>
                  <p class="text-xs text-white/40">Connecting to {playerServerOptions.find(s => s.key === preferredServer)?.label}</p>
                </div>
                
                {#if iframeTimedOut}
                  <div class="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button
                      class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 text-sm font-bold text-black transition-all hover:bg-yellow-300 active:scale-95 shadow-lg shadow-yellow-400/20"
                      on:click={tryNextServer}
                    >
                      <RefreshCw size={16} />
                      Try next server
                    </button>
                    <button
                      class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95"
                      on:click={openInNewTab}
                    >
                      <ExternalLink size={16} />
                      Open in tab
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          <iframe
            title="Player"
            src={streamUrl}
            class="absolute inset-0 h-full w-full"
            on:load={handleIframeLoad}
            allow="autoplay; fullscreen; picture-in-picture"
            referrerpolicy="no-referrer"
          ></iframe>
        </div>
      </div>

      <!-- TV Navigation Overlay/Controls -->
      {#if mediaType === 'tv' && (prevEp || nextEp)}
        <div class="flex items-center justify-between gap-4 mt-6">
          <div class="flex-1">
            {#if prevEp}
              <button
                class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 pr-5 text-left transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                on:click={() => navigateToEpisode(prevEp.episode_number)}
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 text-white/60 group-hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </div>
                <div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-white/30">Previous</div>
                  <div class="text-sm font-medium text-white/80 line-clamp-1">E{prevEp.episode_number}: {prevEp.name || 'Episode ' + prevEp.episode_number}</div>
                </div>
              </button>
            {/if}
          </div>

          <div class="flex-1 flex justify-end">
            {#if nextEp}
              <button
                class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 pl-5 text-right transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                on:click={() => navigateToEpisode(nextEp.episode_number)}
              >
                <div class="order-2 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 group-hover:bg-yellow-300 transition-colors">
                  <ChevronRight size={20} />
                </div>
                <div class="order-1">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-white/30">Next Up</div>
                  <div class="text-sm font-medium text-white/80 line-clamp-1">E{nextEp.episode_number}: {nextEp.name || 'Episode ' + nextEp.episode_number}</div>
                </div>
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Info Section -->
    <div class="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <h4 class="text-sm font-semibold text-white/90">Trouble with playback?</h4>
        <p class="text-xs text-white/40 max-w-sm">Try switching servers if the player doesn't load or is slow. Some servers might be blocked in your region.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/70 transition-all hover:bg-white/10 active:scale-95"
          on:click={tryNextServer}
        >
          <RefreshCw size={14} />
          Switch Server
        </button>
        <button
          class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/70 transition-all hover:bg-white/10 active:scale-95"
          on:click={openInNewTab}
        >
          <ExternalLink size={14} />
          External Player
        </button>
      </div>
    </div>
  {/if}
</section>
