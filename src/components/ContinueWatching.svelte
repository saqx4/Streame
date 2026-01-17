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
  import { Play, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-svelte";

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
  };

  let items: Item[] = [];

  const toHref = (it: WatchHistoryItem) => {
    if (it.type === "movie") {
      return `/watch/movie/${it.tmdb_id}`;
    }

    const s = it.season_number ?? 1;
    const e = it.episode_number ?? 1;
    return `/watch/tv/${it.tmdb_id}/${s}/${e}`;
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
        class="inline-flex h-10 items-center justify-center rounded-xl bg-yellow-400 px-4 text-xs font-black text-black transition-all hover:bg-yellow-300 active:scale-95"
        on:click={() => redirectToLogin(window.location.hash || "#/")}
      >
        Sign in
      </button>
    </div>
  </div>
{:else if !loading && items.length > 0}
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-white">Continue Watching</h2>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-20"
          on:click={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-20"
          on:click={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>

    <div
      bind:this={scroller}
      class="no-scrollbar flex gap-4 overflow-x-auto pb-2 scroll-smooth"
    >
      {#each items as item (`${item.type}-${item.id}`)}
        <div class="group relative shrink-0 w-[200px] sm:w-[240px]">
          <a
            use:link
            href={item.href}
            class="block overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition-all duration-200 hover:ring-yellow-400/50 hover:scale-[1.02]"
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
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/30"
                >
                  <Play size={20} class="text-black" fill="currentColor" />
                </div>
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
                {/if}
              </div>
            </div>
          </a>

          <!-- Delete Button -->
          <button
            class="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 backdrop-blur-md transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100 active:scale-90"
            on:click={(e) => removeItem(e, item)}
            title="Remove from history"
          >
            <Trash2 size={14} />
          </button>
        </div>
      {/each}
    </div>
  </section>
{/if}
