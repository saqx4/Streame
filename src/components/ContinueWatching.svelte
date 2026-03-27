<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import {
    watchHistoryService,
    type WatchHistoryItem,
  } from "../services/watchHistory";
  import { isPlayerServerKey, type PlayerServerKey } from "../services/playerServers";
  import { getPosterUrl } from "../services/tmdb";
  import MediaCard from "./MediaCard.svelte";
  import { redirectToLogin } from "../lib/loginRedirect";
  import { Play, ChevronLeft, ChevronRight, Trash2 } from "lucide-svelte";

  let loading = true;
  let error: string | null = null;
  let userId: string | null = null;
  let needsLogin = false;

  let scroller: HTMLDivElement | null = null;

  const scrollByAmount = (dir: -1 | 1) => {
    if (!scroller) return;
    scroller.scrollBy({ left: dir * 480, behavior: "smooth" });
  };

  type Item = {
    id: number;
    type: "movie" | "tv";
    title: string;
    posterPath: string | null;
    href: string;
    meta?: string | null;
    progressPct?: number;
    remainingLabel?: string | null;
  };

  let items: Item[] = [];

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const formatRemaining = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  };

  const PER_TITLE_SERVER_PREFIX = "streame:lastServer";

  const readPerTitleServer = (it: WatchHistoryItem): PlayerServerKey | undefined => {
    try {
      const key =
        it.type === "tv"
          ? `${PER_TITLE_SERVER_PREFIX}:${it.type}:${it.tmdb_id}:${it.season_number ?? 1}:${it.episode_number ?? 1}`
          : `${PER_TITLE_SERVER_PREFIX}:${it.type}:${it.tmdb_id}`;
      const v = localStorage.getItem(key);
      return v && isPlayerServerKey(v) ? (v as PlayerServerKey) : undefined;
    } catch {
      return undefined;
    }
  };

  const toHref = (it: WatchHistoryItem) => {
    if (it.type === "movie") {
      const base = `/watch/movie/${it.tmdb_id}`;
      const server = readPerTitleServer(it);
      return server ? `${base}?server=${encodeURIComponent(server)}` : base;
    }

    const s = it.season_number ?? 1;
    const e = it.episode_number ?? 1;
    const base = `/watch/tv/${it.tmdb_id}/${s}/${e}`;
    const server = readPerTitleServer(it);
    return server ? `${base}?server=${encodeURIComponent(server)}` : base;
  };

  const dedupeLatest = (history: WatchHistoryItem[]) => {
    const filtered = history;

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
        type: h.type,
        title: h.title,
        posterPath: h.poster_path,
        href: toHref(h),
        meta:
          h.type === "tv"
            ? `S${h.season_number ?? 1} E${h.episode_number ?? 1}`
            : null,
        progressPct: (() => {
          const raw = typeof h.progress === "number" ? h.progress : 0;
          const pct = raw <= 1 ? raw * 100 : raw;
          return clamp(Number.isFinite(pct) ? pct : 0, 0, 100);
        })(),
        remainingLabel: (() => {
          const dur = typeof h.duration === "number" ? h.duration : null;
          const pos = typeof h.last_position === "number" ? h.last_position : null;
          if (dur && dur > 0 && pos !== null && pos >= 0 && pos <= dur) {
            return formatRemaining(dur - pos);
          }
          return null;
        })(),
      }));
    } catch (e: any) {
      console.error("Failed to load Continue Watching", e);
      error = e?.message ?? "Failed to load Continue Watching";
      items = [];
    } finally {
      loading = false;
    }
  };

  const removeItem = async (e: MouseEvent, item: Item) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;

    // Optimistic UI update
    items = items.filter((i) => !(i.id === item.id && i.type === item.type));

    try {
      await watchHistoryService.remove(userId, item.id, item.type);
    } catch (err) {
      console.error("Failed to remove item", err);
      // Re-load if failed
      load();
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
        class="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 text-xs font-black text-black transition-all hover:bg-accent active:scale-95"
        on:click={() => redirectToLogin(window.location.hash || "#/")}
      >
        Sign in
      </button>
    </div>
  </div>
{:else if !loading && items.length > 0}
  <section class="space-y-6 animate-in">
    <div class="flex items-center justify-between px-2">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-black tracking-tight text-white sm:text-2xl">Continue Watching</h2>
        <div class="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="group inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/5 ring-1 ring-white/10 hover:bg-accent hover:ring-accent hover:text-black transition-all duration-300 active:scale-95 disabled:opacity-20"
          on:click={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} class="transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button
          class="group inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/5 ring-1 ring-white/10 hover:bg-accent hover:ring-accent hover:text-black transition-all duration-300 active:scale-95 disabled:opacity-20"
          on:click={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} class="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>

    <div class="relative group/carousel">
      <!-- Gradient edges removed based on user feedback -->

      <div
        bind:this={scroller}
        class="no-scrollbar flex gap-6 overflow-x-auto pb-8 pr-4 pl-2 pt-2 scroll-smooth"
      >
        {#each items as item (`${item.type}-${item.id}`)}
          <div class="group relative shrink-0">
            <MediaCard
              title={item.title}
              posterPath={item.posterPath}
              backdropPath={(item as any).backdropPath}
              href={item.href}
              meta={item.meta}
              progress={item.progressPct}
              remaining={item.remainingLabel}
            />

            <!-- Remove Button -->
            <button
              class="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 text-white/60 opacity-0 backdrop-blur-md border border-white/10 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100 shadow-2xl active:scale-90"
              on:click={(e) => removeItem(e, item)}
              aria-label={`Remove ${item.title} from Continue Watching`}
              title="Remove from history"
            >
              <Trash2 size={14} />
            </button>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}
