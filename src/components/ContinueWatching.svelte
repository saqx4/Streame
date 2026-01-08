<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import {
    watchHistoryService,
    type WatchHistoryItem,
  } from "../services/watchHistory";
  import { getPosterUrl } from "../services/tmdb";
  import { redirectToLogin } from "../lib/loginRedirect";
  import { isPlayerServerKey } from "../services/playerServers";
  import { Play, X } from "lucide-svelte";

  let loading = true;
  let error: string | null = null;
  let userId: string | null = null;
  let needsLogin = false;

  type Item = {
    id: number;
    title: string;
    posterPath: string | null;
    href: string;
    progress: number;
    meta?: string | null;
  };

  let items: Item[] = [];

  const PER_TITLE_SERVER_PREFIX = "streame:lastServer";

  const readLastServerFor = (it: WatchHistoryItem) => {
    try {
      const baseKey =
        it.type === "tv"
          ? `${PER_TITLE_SERVER_PREFIX}:${it.type}:${it.tmdb_id}:${it.season_number ?? 1}:${it.episode_number ?? 1}`
          : `${PER_TITLE_SERVER_PREFIX}:${it.type}:${it.tmdb_id}`;

      const v = localStorage.getItem(baseKey);
      return v && isPlayerServerKey(v) ? v : null;
    } catch {
      return null;
    }
  };

  const toHref = (it: WatchHistoryItem) => {
    const startAt =
      it.last_position && it.last_position > 0
        ? Math.floor(it.last_position)
        : 0;
    const server = readLastServerFor(it);
    const serverQuery = server ? `?server=${encodeURIComponent(server)}` : "";

    if (it.type === "movie") {
      return startAt > 0
        ? `/watch/movie/${it.tmdb_id}/${startAt}${serverQuery}`
        : `/watch/movie/${it.tmdb_id}${serverQuery}`;
    }

    const s = it.season_number ?? 1;
    const e = it.episode_number ?? 1;
    return startAt > 0
      ? `/watch/tv/${it.tmdb_id}/${s}/${e}/${startAt}${serverQuery}`
      : `/watch/tv/${it.tmdb_id}/${s}/${e}${serverQuery}`;
  };

  const dedupeLatest = (history: WatchHistoryItem[]) => {
    const filtered = history.filter((h) => h.progress > 0 && h.progress < 100);

    const latestMap = new Map<string, WatchHistoryItem>();
    for (const h of filtered) {
      const key = `${h.type}-${h.tmdb_id}`;
      const existing = latestMap.get(key);
      if (!existing) {
        latestMap.set(key, h);
        continue;
      }
      if (
        new Date(h.last_watched).getTime() >
        new Date(existing.last_watched).getTime()
      ) {
        latestMap.set(key, h);
      }
    }

    return Array.from(latestMap.values()).sort(
      (a, b) =>
        new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime(),
    );
  };

  const load = async () => {
    loading = true;
    error = null;
    needsLogin = false;

    try {
      if (!isSupabaseEnabled) {
        userId = null;
        items = [];
        return;
      }

      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;

      if (!userId) {
        needsLogin = true;
        items = [];
        return;
      }

      const history = await watchHistoryService.list(userId, 20);
      const deduped = dedupeLatest(history);

      items = deduped.slice(0, 10).map((h) => ({
        id: h.tmdb_id,
        title: h.title,
        posterPath: h.poster_path,
        href: toHref(h),
        progress: h.progress || 0,
        meta:
          h.type === "tv"
            ? `S${h.season_number ?? 1} E${h.episode_number ?? 1}`
            : null,
      }));
    } catch (e: any) {
      console.error("Failed to load Continue Watching", e);
      error = e?.message ?? "Failed to load Continue Watching";
      items = [];
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    load();
  });
</script>

{#if error}
  <div
    class="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200"
  >
    {error}
  </div>
{:else if !loading && needsLogin}
  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div class="text-sm font-semibold">Continue Watching</div>
        <div class="mt-1 text-xs text-white/60">
          Sign in to see your synced watch history.
        </div>
      </div>
      <button
        class="inline-flex h-10 items-center justify-center rounded-xl bg-yellow-400 px-4 text-xs font-black text-black transition-all hover:bg-yellow-300 active:scale-95"
        on:click={() => redirectToLogin(window.location.hash || "#/")}
      >
        Sign in
      </button>
    </div>
  </div>
{:else if !loading && items.length > 0}
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-white">Continue Watching</h2>

    <div class="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {#each items as item (item.id)}
        <a
          use:link
          href={item.href}
          class="group relative flex-shrink-0 w-[200px] sm:w-[240px] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition-all duration-200 hover:ring-yellow-400/50 hover:scale-[1.02]"
        >
          <!-- Poster -->
          <div class="relative aspect-video overflow-hidden">
            <img
              src={getPosterUrl(item.posterPath, "w500")}
              alt={item.title}
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            <!-- Play Overlay -->
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/30"
              >
                <Play size={24} class="text-black" fill="currentColor" />
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
              <div
                class="h-full bg-yellow-400 transition-all duration-300"
                style="width: {item.progress}%"
              ></div>
            </div>
          </div>

          <!-- Info -->
          <div class="p-3">
            <h3 class="line-clamp-1 text-sm font-semibold text-white">
              {item.title}
            </h3>
            <div class="mt-1 flex items-center gap-2">
              {#if item.meta}
                <span class="text-xs text-white/60">{item.meta}</span>
                <span class="text-white/30">•</span>
              {/if}
              <span class="text-xs text-yellow-400"
                >{Math.round(item.progress)}% watched</span
              >
            </div>
          </div>
        </a>
      {/each}
    </div>
  </section>
{/if}
