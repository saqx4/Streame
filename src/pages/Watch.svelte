<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import { params, push } from "svelte-spa-router";
  import { getStreamingUrl, tmdbService } from "../services/tmdb";
  import {
    playerServers,
    type PlayerServerKey,
    isPlayerServerKey,
  } from "../services/playerServers";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { watchHistoryService } from "../services/watchHistory";
  import { ArrowLeft, ChevronLeft, ChevronRight, Server, ExternalLink, RefreshCw, ChevronDown, Check } from "lucide-svelte";

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

  let serverPickerOpen = false;
  let serverPickerEl: HTMLDivElement | null = null;

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

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!serverPickerOpen) return;
      if (serverPickerEl && t && !serverPickerEl.contains(t)) serverPickerOpen = false;
    };
    document.addEventListener("mousedown", onDocClick);

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

    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
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
  $: currentEp = (mediaType === "tv" && seasonData && episodeNumber)
    ? (seasonData.episodes || []).find((e: any) => e.episode_number === episodeNumber)
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
    const i = $playerServers.findIndex((s) => s.id === preferredServer);
    const next = $playerServers[(i >= 0 ? i + 1 : 0) % $playerServers.length]?.id;
    if (next) savePreferredServer(next);
  };

  $: streamUrl = tmdbId
    ? getStreamingUrl(
        tmdbId,
        mediaType,
        preferredServer,
        $playerServers,
        mediaType === "tv" ? seasonNumber : undefined,
        mediaType === "tv" ? episodeNumber : undefined,
        startAtFromQuery
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
  $: if ($playerServers.length > 0 && preferredServer && !$playerServers.find(s => s.id === preferredServer)) {
    preferredServer = $playerServers[0].id;
  }
  $: if (tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    void loadMeta(metaKey);
  }

  $: if (userId && title && tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    void recordOpened();
  }
</script>

<section class="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-in pb-12">
  <!-- Header / Navigation -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
    <div class="flex items-center gap-4 sm:gap-5">
      <button 
        on:click={goBack}
        class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 active:scale-95"
        aria-label="Go back"
      >
        <ArrowLeft size={20} class="sm:w-5.5 sm:h-5.5" />
      </button>
      <div class="space-y-0.5 sm:space-y-1 min-w-0">
        <h1 class="text-xl font-black tracking-tight sm:text-3xl line-clamp-1">
          {title || 'Loading...'}
        </h1>
        <div class="flex items-center gap-2 sm:gap-3">
          <span class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md sm:rounded-lg ring-1 ring-yellow-400/20">
            {mediaType}
          </span>
          {#if mediaType === 'tv' && seasonNumber && episodeNumber}
            <span class="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
              S{seasonNumber} • E{episodeNumber}
            </span>
            {#if currentEp?.name}
              <span class="h-1 w-1 rounded-full bg-white/20 hidden xs:block"></span>
              <span class="text-[10px] sm:text-xs font-bold text-white/60 truncate max-w-[120px] sm:max-w-[200px] hidden xs:block">{currentEp.name}</span>
            {/if}
          {/if}
        </div>
      </div>
    </div>

    <!-- Server Selector -->
    <div class="relative w-full sm:min-w-[260px] sm:w-auto" bind:this={serverPickerEl}>
      <button
        type="button"
        class="group flex w-full items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 text-xs sm:text-sm font-black transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98] backdrop-blur-3xl"
        aria-haspopup="listbox"
        aria-expanded={serverPickerOpen}
        on:click={() => (serverPickerOpen = !serverPickerOpen)}
      >
        <span class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/20">
            <Server size={16} class="sm:w-[18px] sm:h-[18px]" />
          </div>
          <div class="text-left min-w-0">
            <span class="block text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Current Server</span>
            <span class="block line-clamp-1 text-white/80">
              {$playerServers.find((s) => s.id === preferredServer)?.name || preferredServer}
            </span>
          </div>
        </span>
        <ChevronDown
          size={16}
          class={`text-white/30 transition-transform duration-300 ${serverPickerOpen ? "rotate-180" : ""}`}
        />
      </button>

      {#if serverPickerOpen}
        <div
          class="absolute right-0 left-0 sm:left-auto top-[calc(100%+8px)] sm:top-[calc(100%+12px)] z-50 sm:w-[400px] max-w-[96vw] overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          role="listbox"
        >
          <div class="p-2 sm:p-3 border-b border-white/5">
            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Available Servers</span>
          </div>
          <div class="overscroll-contain max-h-[300px] sm:max-h-[400px] overflow-auto p-1.5 sm:p-2 custom-scrollbar">
            {#each $playerServers as s}
              {@const isActive = s.id === preferredServer}
              <button
                type="button"
                class={`flex w-full items-center justify-between gap-3 rounded-lg sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-left text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                on:click={() => {
                  if (isPlayerServerKey(s.id)) savePreferredServer(s.id);
                  serverPickerOpen = false;
                }}
              >
                <span class="line-clamp-1">{s.name}</span>
                {#if isActive}
                  <Check size={16} class="sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if !tmdbId}
    <div class="flex flex-col items-center justify-center py-20 sm:py-32 rounded-[32px] sm:rounded-[48px] border-2 border-dashed border-white/5 bg-white/[0.02] text-center mx-2">
      <div class="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 sm:mb-6">
        <ExternalLink size={24} class="sm:w-8 sm:h-8" />
      </div>
      <h3 class="text-lg sm:text-xl font-black text-white">Playback Error</h3>
      <p class="text-[10px] sm:text-sm font-bold text-white/30 mt-2 max-w-[240px] uppercase tracking-widest leading-relaxed">Media identifier is missing or invalid.</p>
    </div>
  {:else}
    <div class="relative group px-2 sm:px-0">
      <!-- Player Container -->
      <div class="relative overflow-hidden rounded-[24px] sm:rounded-[48px] border border-white/10 bg-[#050505] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 ring-1 ring-white/5">
        <div class="relative aspect-video">
          {#if !iframeLoaded}
            <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]/80 backdrop-blur-3xl">
              <div class="flex flex-col items-center gap-4 sm:gap-6 px-6 text-center">
                <div class="relative h-12 w-12 sm:h-20 sm:w-20">
                  <div class="absolute inset-0 rounded-full border-2 sm:border-4 border-yellow-400/10"></div>
                  <div class="absolute inset-0 rounded-full border-2 sm:border-4 border-t-yellow-400 animate-[spin_1s_linear_infinite] shadow-[0_0_20px_rgba(250,204,21,0.3)]"></div>
                </div>
                <div class="space-y-1 sm:space-y-2">
                  <p class="text-sm sm:text-lg font-black tracking-tight text-white">Connecting to Stream</p>
                  <p class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Server: {$playerServers.find(s => s.id === preferredServer)?.name}</p>
                </div>
                
                {#if iframeTimedOut}
                  <div class="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button
                      class="inline-flex h-10 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-[24px] bg-yellow-400 px-6 sm:px-8 text-xs sm:text-sm font-black text-black transition-all hover:bg-yellow-300 hover:scale-105 active:scale-95 shadow-xl shadow-yellow-400/20"
                      on:click={tryNextServer}
                    >
                      <RefreshCw size={14} class="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                      Next Server
                    </button>
                    <button
                      class="inline-flex h-10 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-[24px] border border-white/10 bg-white/5 px-6 sm:px-8 text-xs sm:text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                      on:click={openInNewTab}
                    >
                      <ExternalLink size={14} class="sm:w-[18px] sm:h-[18px]" />
                      Open Externally
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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div>
            {#if prevEp}
              <button
                class="group flex w-full items-center gap-3 sm:gap-5 rounded-[20px] sm:rounded-[32px] border border-white/10 bg-white/[0.02] p-3 sm:p-4 text-left transition-all hover:bg-white/[0.05] hover:ring-2 hover:ring-white/10 active:scale-[0.98]"
                on:click={() => navigateToEpisode(prevEp.episode_number)}
              >
                <div class="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 text-white/40 transition-all group-hover:bg-white/10 group-hover:text-white">
                  <ChevronLeft size={20} class="sm:w-7 sm:h-7" />
                </div>
                <div class="min-w-0">
                  <div class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Previous</div>
                  <div class="text-sm sm:text-base font-black text-white/80 line-clamp-1">E{prevEp.episode_number}: {prevEp.name || 'Untitled'}</div>
                </div>
              </button>
            {/if}
          </div>

          <div class="flex justify-end">
            {#if nextEp}
              <button
                class="group flex w-full items-center justify-between gap-3 sm:gap-5 rounded-[20px] sm:rounded-[32px] border border-white/10 bg-white/[0.02] p-3 sm:p-4 text-right transition-all hover:bg-white/[0.05] hover:ring-2 hover:ring-yellow-400/20 active:scale-[0.98]"
                on:click={() => navigateToEpisode(nextEp.episode_number)}
              >
                <div class="min-w-0 text-left sm:text-right ml-0 sm:ml-4">
                  <div class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Up Next</div>
                  <div class="text-sm sm:text-base font-black text-white/80 line-clamp-1">E{nextEp.episode_number}: {nextEp.name || 'Untitled'}</div>
                </div>
                <div class="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-yellow-400 text-black shadow-xl shadow-yellow-400/20 transition-all group-hover:bg-yellow-300 group-hover:scale-105">
                  <ChevronRight size={20} class="sm:w-7 sm:h-7" strokeWidth={2.5} />
                </div>
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Info Section -->
    <div class="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/[0.02] border border-white/10 backdrop-blur-3xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mx-2 sm:mx-0">
      <div class="space-y-1 sm:space-y-2">
        <h4 class="text-sm sm:text-base font-black tracking-tight text-white/90">Troubleshooting</h4>
        <p class="text-[11px] sm:text-sm font-medium text-white/30 max-w-lg leading-relaxed">Try switching servers if the stream buffers. Some providers might be restricted in your location.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          class="flex-1 sm:flex-none inline-flex h-10 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 text-xs sm:text-sm font-black text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          on:click={tryNextServer}
        >
          <RefreshCw size={14} class="sm:w-[18px] sm:h-[18px]" />
          Change Server
        </button>
        <button
          class="flex-1 sm:flex-none inline-flex h-10 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 text-xs sm:text-sm font-black text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          on:click={openInNewTab}
        >
          <ExternalLink size={14} class="sm:w-[18px] sm:h-[18px]" />
          Pop-out
        </button>
      </div>
    </div>
  {/if}
</section>
