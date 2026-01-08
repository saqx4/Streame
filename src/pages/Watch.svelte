<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import { params } from "svelte-spa-router";
  import { getStreamingUrl, tmdbService } from "../services/tmdb";
  import {
    playerServerOptions,
    type PlayerServerKey,
    isPlayerServerKey,
  } from "../services/playerServers";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { watchHistoryService } from "../services/watchHistory";

  type RouteParams = {
    type?: "movie" | "tv";
    id?: string;
    season?: string;
    episode?: string;
    startAt?: string;
  };

  const route = derived(params, ($p) => $p as unknown as RouteParams);

  const STORAGE_KEY = "streame:preferredServer";
  const PER_TITLE_SERVER_PREFIX = "streame:lastServer";
  const ESTIMATE_TICK_MS = 2_000;
  const REMOTE_SAVE_EVERY_MS = 15_000;

  let preferredServer: PlayerServerKey = "server7";
  let startAtFromQuery: number | undefined = undefined;
  let serverFromQuery: PlayerServerKey | undefined = undefined;

  let userId: string | null = null;
  let title: string | null = null;
  let posterPath: string | null = null;
  let durationSeconds: number | null = null;

  let sessionStartMs = Date.now();
  let baseStartAt = 0;
  let intervalId: any = null;
  let lastSavedMs = 0;

  let metaKey = "";
  let metaReq = 0;

  let authSub: any = null;

  let iframeLoaded = false;
  let iframeTimedOut = false;
  let iframeTimeoutId: any = null;

  const loadPreferredServer = () => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && isPlayerServerKey(v)) {
        preferredServer = v;
      }
    } catch {
      // ignore
    }
  };

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
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }

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

  loadPreferredServer();

  onMount(() => {
    readQueryParams();
    window.addEventListener("hashchange", readQueryParams);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

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

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      saveProgress(false);
    }, ESTIMATE_TICK_MS);
  });

  onDestroy(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("beforeunload", handlePageHide);
    if (intervalId) clearInterval(intervalId);
    if (iframeTimeoutId) clearTimeout(iframeTimeoutId);
    try {
      authSub?.unsubscribe?.();
    } catch {
      // ignore
    }
    flushProgress();
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
  $: rawStartAt = cleanParam(p.startAt);

  $: hasEpisodeInfo = rawSeason !== undefined && rawEpisode !== undefined;
  $: mediaType = (rawType === "tv" || hasEpisodeInfo
    ? "tv"
    : "movie") as unknown as "movie" | "tv";
  $: tmdbId = Number(rawId ?? 0);
  $: seasonNumber = rawSeason ? Number(rawSeason) : undefined;
  $: episodeNumber = rawEpisode ? Number(rawEpisode) : undefined;
  $: startAtFromParams = rawStartAt ? Number(rawStartAt) : undefined;
  $: startAt =
    typeof startAtFromParams === "number" &&
    Number.isFinite(startAtFromParams) &&
    startAtFromParams > 0
      ? Math.floor(startAtFromParams)
      : startAtFromQuery;

  const currentEstimatedPosition = () => {
    const delta = Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000));
    return Math.max(0, baseStartAt + delta);
  };

  const clampProgress = (p: number) => {
    if (!Number.isFinite(p)) return 1;
    if (p < 1) return 1;
    if (p > 99) return 99;
    return Math.round(p);
  };

  const saveProgress = async (force = false) => {
    if (!isSupabaseEnabled) return;
    if (!userId) return;
    if (!tmdbId || !Number.isFinite(tmdbId) || tmdbId <= 0) return;
    if (!title) return;

    savePerTitleServer(preferredServer);

    const now = Date.now();
    if (!force && now - lastSavedMs < REMOTE_SAVE_EVERY_MS) return;

    const last_position = currentEstimatedPosition();
    if (last_position <= 0) return;

    const fallbackDuration = mediaType === "movie" ? 2 * 60 * 60 : 45 * 60;
    const d =
      typeof durationSeconds === "number" && durationSeconds > 0
        ? durationSeconds
        : fallbackDuration;
    const progress = clampProgress((last_position / d) * 100);

    lastSavedMs = now;
    await watchHistoryService.add(userId, {
      tmdb_id: tmdbId,
      type: mediaType,
      title,
      poster_path: posterPath ?? null,
      progress,
      duration: d,
      last_position,
      season_number: mediaType === "tv" ? seasonNumber : undefined,
      episode_number: mediaType === "tv" ? episodeNumber : undefined,
      last_watched: new Date().toISOString(),
    });
  };

  const flushProgress = async () => {
    try {
      await saveProgress(true);
    } catch {
      // ignore
    }
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

  const loadMeta = async (key: string) => {
    const reqId = ++metaReq;

    title = null;
    posterPath = null;
    durationSeconds = null;

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

  const handleVisibilityChange = () => {
    if (document.hidden) {
      flushProgress();
    }
  };

  const handlePageHide = () => {
    flushProgress();
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
        startAt,
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

  $: if (
    typeof startAt === "number" &&
    Number.isFinite(startAt) &&
    startAt >= 0
  ) {
    baseStartAt = Math.floor(startAt);
    sessionStartMs = Date.now();
    lastSavedMs = 0;
  }

  $: metaKey = `${mediaType}:${tmdbId}:${seasonNumber ?? ""}:${episodeNumber ?? ""}`;
  $: if (tmdbId && Number.isFinite(tmdbId) && tmdbId > 0) {
    void loadMeta(metaKey);
  }
</script>

<section class="space-y-4">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h1 class="text-2xl font-semibold">Watch</h1>
      <p class="mt-1 text-sm text-white/60">
        {#if mediaType === "tv"}
          TV • TMDB {tmdbId}{#if seasonNumber && episodeNumber}
            • S{seasonNumber} E{episodeNumber}{/if}
        {:else}
          Movie • TMDB {tmdbId}
        {/if}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#each playerServerOptions as s}
        <button
          class={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            preferredServer === s.key
              ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
          on:click={() => savePreferredServer(s.key)}
        >
          {s.label}
        </button>
      {/each}
    </div>
  </div>

  {#if !tmdbId}
    <div
      class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70"
    >
      Invalid watch URL.
    </div>
  {:else}
    <div
      class="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <!-- Video Player -->
      <div class="relative aspect-video">
        {#if !iframeLoaded}
          <div
            class="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950"
          >
            <div class="flex flex-col items-center gap-4 px-6 text-center">
              <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400/30 border-t-yellow-400"
              ></div>
              <p class="text-sm text-white/60">Loading player...</p>
              {#if iframeTimedOut}
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <button
                    class="inline-flex h-10 items-center justify-center rounded-xl bg-yellow-400 px-4 text-xs font-black text-black transition-all hover:bg-yellow-300 active:scale-95"
                    on:click={tryNextServer}
                  >
                    Try next server
                  </button>
                  <button
                    class="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white transition-all hover:bg-white/10 active:scale-95"
                    on:click={openInNewTab}
                  >
                    Open in new tab
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
  {/if}
</section>
