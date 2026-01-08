<script lang="ts">
    import { link } from "svelte-spa-router";
    import { fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { Play, Bookmark, Share2, Film } from "lucide-svelte";
    import {
        getBackdropUrl,
        getPosterUrl,
        tmdbService,
    } from "../services/tmdb";
    import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
    import { userMediaService } from "../services/userMedia";
    import { redirectToLogin } from "../lib/loginRedirect";
    import { onMount, onDestroy } from "svelte";
    import RatingBadge from "./RatingBadge.svelte";
    import PosterOverlay from "./PosterOverlay.svelte";
    import TrailerModal from "./TrailerModal.svelte";

    export let item: any;
    export let type: "movie" | "tv";
    export let activeTab: string = "overview";

    const LOCAL_WATCHLIST_KEY = "streame:watchlist";

    let userId: string | null = null;
    let isInWatchlist = false;
    let watchlistBusy = false;

    // Backdrop gallery slideshow
    let backdropImages: string[] = [];
    let currentBackdropIndex = 0;
    let backdropTimer: ReturnType<typeof setInterval> | null = null;
    const BACKDROP_INTERVAL = 7000; // 7 seconds per image

    let trailerKey = "";
    let showTrailer = false;

    $: title = (type === "movie" ? item?.title : item?.name) ?? "";
    $: posterUrl = getPosterUrl(item?.poster_path, "w500");
    $: rating = item?.vote_average ?? null;
    $: watchHref = `/watch/${type}/${item?.id}`;
    $: currentBackdrop =
        backdropImages.length > 0
            ? backdropImages[currentBackdropIndex]
            : getBackdropUrl(item?.backdrop_path, "original");

    // Fetch backdrop images from TMDB
    const loadBackdropGallery = async () => {
        if (!item?.id) return;

        try {
            const images =
                type === "movie"
                    ? await tmdbService.getMovieImages(item.id)
                    : await tmdbService.getTVShowImages(item.id);

            if (images?.backdrops?.length > 0) {
                // Get up to 10 backdrops, prioritizing English ones
                const sortedBackdrops = [...images.backdrops]
                    .sort((a: any, b: any) => {
                        if (a.iso_639_1 === "en" && b.iso_639_1 !== "en")
                            return -1;
                        if (a.iso_639_1 !== "en" && b.iso_639_1 === "en")
                            return 1;
                        return (b.vote_average || 0) - (a.vote_average || 0);
                    })
                    .slice(0, 10);

                const mainBackdrop = getBackdropUrl(
                    item.backdrop_path,
                    "original",
                );
                const galleryBackdrops = sortedBackdrops
                    .filter((b: any) => b.file_path !== item.backdrop_path)
                    .map((b: any) => getBackdropUrl(b.file_path, "original"));

                backdropImages = [mainBackdrop, ...galleryBackdrops];

                // Start rotation if we have multiple images
                if (backdropImages.length > 1) {
                    currentBackdropIndex = 0; // Ensure we start with main
                    startBackdropRotation();
                }
            } else {
                // Fallback to main backdrop
                backdropImages = item?.backdrop_path
                    ? [getBackdropUrl(item.backdrop_path, "original")]
                    : [];
            }
        } catch (e) {
            console.error("Failed to load backdrop gallery:", e);
            backdropImages = item?.backdrop_path
                ? [getBackdropUrl(item.backdrop_path, "original")]
                : [];
        }
    };

    const startBackdropRotation = () => {
        if (backdropTimer) clearInterval(backdropTimer);
        if (backdropImages.length <= 1) return;

        backdropTimer = setInterval(() => {
            currentBackdropIndex =
                (currentBackdropIndex + 1) % backdropImages.length;

            // Prefetch next image for smoother transition
            const nextIdx = (currentBackdropIndex + 1) % backdropImages.length;
            const img = new Image();
            img.src = backdropImages[nextIdx];
        }, BACKDROP_INTERVAL);
    };

    const stopBackdropRotation = () => {
        if (backdropTimer) {
            clearInterval(backdropTimer);
            backdropTimer = null;
        }
    };

    const getLocalWatchlist = (): any[] => {
        try {
            const raw = localStorage.getItem(LOCAL_WATCHLIST_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const setLocalWatchlist = (items: any[]) => {
        try {
            localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(items));
        } catch {
            // ignore
        }
    };

    const refreshWatchlistState = async () => {
        try {
            if (isSupabaseEnabled) {
                const { data } = await supabase.auth.getUser();
                userId = data?.user?.id ?? null;
                if (userId) {
                    isInWatchlist = await userMediaService.has(
                        userId,
                        Number(item?.id ?? 0),
                        "watchlist",
                    );
                    return;
                }
            } else {
                userId = null;
            }

            const local = getLocalWatchlist();
            isInWatchlist = local.some(
                (x) => Number(x?.tmdb_id) === Number(item?.id ?? 0),
            );
        } catch {
            isInWatchlist = false;
        }
    };

    const toggleWatchlist = async () => {
        const tmdbId = Number(item?.id ?? 0);
        if (!tmdbId || watchlistBusy) return;

        if (isSupabaseEnabled && !userId) {
            redirectToLogin(window.location.hash || "#/");
            return;
        }

        watchlistBusy = true;
        try {
            if (userId) {
                if (isInWatchlist) {
                    await userMediaService.remove(userId, tmdbId, "watchlist");
                    isInWatchlist = false;
                } else {
                    await userMediaService.add(
                        userId,
                        {
                            tmdb_id: tmdbId,
                            type,
                            title,
                            poster_path: item?.poster_path ?? null,
                        },
                        "watchlist",
                    );
                    isInWatchlist = true;
                }
                return;
            }

            const local = getLocalWatchlist();
            const exists = local.some((x) => Number(x?.tmdb_id) === tmdbId);
            const next = exists
                ? local.filter((x) => Number(x?.tmdb_id) !== tmdbId)
                : [
                      {
                          tmdb_id: tmdbId,
                          type,
                          title,
                          poster_path: item?.poster_path ?? null,
                      },
                      ...local,
                  ];
            setLocalWatchlist(next);
            isInWatchlist = !exists;
        } finally {
            watchlistBusy = false;
        }
    };

    const tabs = [
        { id: "episodes", label: "Episodes", show: type === "tv" },
        { id: "overview", label: "Overview", show: true },
        { id: "casts", label: "Casts", show: true },
        { id: "reviews", label: "Reviews", show: true },
        { id: "related", label: "Related", show: true },
    ];

    $: visibleTabs = tabs.filter((t) => t.show);

    const formatRuntime = (minutes: number) => {
        if (!minutes) return "—";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}hr ${m}min` : `${m}min`;
    };

    const handleShare = async () => {
        const shareData = {
            title,
            text: `Check out ${title} on Streame!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const handleTrailer = async () => {
        try {
            const data =
                type === "movie"
                    ? await tmdbService.getMovieVideos(item.id)
                    : await tmdbService.getTVShowVideos(item.id);

            const trailer =
                data.results.find(
                    (v: any) => v.type === "Trailer" && v.site === "YouTube",
                ) || data.results.find((v: any) => v.site === "YouTube");

            if (trailer) {
                trailerKey = trailer.key;
                showTrailer = true;
            } else {
                alert("No trailer available for this title.");
            }
        } catch (e) {
            console.error("Failed to load trailer:", e);
        }
    };

    $: if (item?.id) {
        refreshWatchlistState();
        loadBackdropGallery();
    }

    onMount(() => {
        refreshWatchlistState();
        loadBackdropGallery();
    });

    onDestroy(() => {
        stopBackdropRotation();
    });
</script>

<div class="detail-layout">
    <!-- Hero Banner -->
    <div class="hero-banner" in:fade={{ duration: 400, easing: cubicOut }}>
        <!-- Backdrop -->
        <div class="backdrop">
            {#key currentBackdropIndex}
                {#if currentBackdrop}
                    <img
                        src={currentBackdrop}
                        alt={title}
                        class="backdrop-image"
                        in:fade={{ duration: 800, easing: cubicOut }}
                        out:fade={{ duration: 600, easing: cubicOut }}
                    />
                {/if}
            {/key}

            <!-- Vignette Overlays -->
            <div class="vignette-bottom"></div>
            <div class="vignette-left"></div>
            <div class="vignette-radial"></div>
        </div>

        <!-- Content Layer -->
        <div class="hero-content">
            <!-- Poster -->
            <div
                class="poster-section"
                in:scale={{ duration: 500, delay: 100, easing: cubicOut }}
            >
                <div class="poster-wrapper">
                    <PosterOverlay {posterUrl} alt={title} />
                </div>
                {#if rating}
                    <div class="rating-position">
                        <RatingBadge {rating} size="md" />
                    </div>
                {/if}
            </div>

            <!-- Actions Panel -->
            <div
                class="actions-panel"
                in:fade={{ duration: 400, delay: 200, easing: cubicOut }}
            >
                <div class="actions-card">
                    <h1 class="media-title">{title}</h1>

                    <div class="actions-row">
                        <a use:link href={watchHref} class="btn-primary">
                            <Play size={16} fill="currentColor" />
                            <span>Watch</span>
                        </a>

                        <button class="btn-secondary" on:click={handleTrailer}>
                            <Film size={14} />
                            <span>Trailers</span>
                        </button>

                        <div class="divider"></div>

                        <button
                            class="btn-icon"
                            class:active={isInWatchlist}
                            class:busy={watchlistBusy}
                            on:click={toggleWatchlist}
                            aria-label="Toggle watchlist"
                        >
                            <Bookmark size={18} />
                        </button>

                        <button
                            class="btn-icon"
                            on:click={handleShare}
                            aria-label="Share"
                        >
                            <Share2 size={18} />
                        </button>

                        <div class="type-label">
                            <span>{type === "movie" ? "MOVIE" : "SHOW"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabs Section -->
    <div class="tabs-section">
        <div class="tabs-container">
            <!-- Tab Headers -->
            <nav class="tab-nav">
                {#each visibleTabs as tab (tab.id)}
                    <button
                        class="tab-btn"
                        class:active={activeTab === tab.id}
                        on:click={() => (activeTab = tab.id)}
                    >
                        {tab.label}
                        {#if activeTab === tab.id}
                            <div class="tab-indicator"></div>
                        {/if}
                    </button>
                {/each}
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
                {#if activeTab === "overview"}
                    <div class="overview-content">
                        <p class="overview-text">{item.overview}</p>

                        <div class="metadata-grid">
                            <div class="meta-item">
                                <span class="meta-label">Release</span>
                                <span class="meta-value">
                                    {item.release_date ||
                                        item.first_air_date ||
                                        "—"}
                                </span>
                            </div>

                            <div class="meta-item">
                                <span class="meta-label">Runtime</span>
                                <span class="meta-value">
                                    {formatRuntime(
                                        item.runtime ||
                                            (item.episode_run_time
                                                ? item.episode_run_time[0]
                                                : 0),
                                    )}
                                </span>
                            </div>

                            <div class="meta-item">
                                <span class="meta-label">Genre</span>
                                <span class="meta-value">
                                    {item.genres
                                        ?.map((g: any) => g.name)
                                        .join(", ") || "—"}
                                </span>
                            </div>

                            {#if item.belongs_to_collection}
                                <div class="meta-item">
                                    <span class="meta-label">Collection</span>
                                    <span class="meta-value"
                                        >{item.belongs_to_collection.name}</span
                                    >
                                </div>
                            {/if}

                            <div class="meta-item">
                                <span class="meta-label">Languages</span>
                                <span class="meta-value">
                                    {item.spoken_languages
                                        ?.map((l: any) => l.name)
                                        .join(", ") || "—"}
                                </span>
                            </div>

                            <div class="meta-item">
                                <span class="meta-label">Countries</span>
                                <span class="meta-value">
                                    {item.production_countries
                                        ?.map((c: any) => c.name)
                                        .join(", ") || "—"}
                                </span>
                            </div>

                            <div class="meta-item full-width">
                                <span class="meta-label">Production</span>
                                <span class="meta-value">
                                    {item.production_companies
                                        ?.map((c: any) => c.name)
                                        .join(", ") || "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                {:else}
                    <slot name="tab-content" {activeTab}></slot>
                {/if}
            </div>
        </div>
    </div>

    {#if showTrailer}
        <TrailerModal
            videoKey={trailerKey}
            title={`${title} - Trailer`}
            on:close={() => (showTrailer = false)}
        />
    {/if}
</div>

<style>
    .detail-layout {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    /* Hero Banner */
    .hero-banner {
        position: relative;
        width: 100%;
        height: 480px;
        border-radius: 32px;
        overflow: hidden;
        background: #0a0a0a;
        box-shadow:
            0 32px 64px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    @media (min-width: 640px) {
        .hero-banner {
            height: 540px;
            border-radius: 40px;
        }
    }

    @media (min-width: 1024px) {
        .hero-banner {
            height: 580px;
            border-radius: 48px;
        }
    }

    /* Backdrop */
    .backdrop {
        position: absolute;
        inset: 0;
    }

    .backdrop-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
    }

    /* Vignette Effects */
    .vignette-bottom {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(0, 0, 0, 0.7) 20%,
            rgba(0, 0, 0, 0.3) 40%,
            transparent 70%
        );
    }

    .vignette-left {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.2) 30%,
            transparent 60%
        );
    }

    .vignette-radial {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse 120% 100% at 50% 100%,
            rgba(0, 0, 0, 0.3) 0%,
            transparent 50%
        );
    }

    /* Hero Content */
    .hero-content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-end;
        padding: 1.5rem;
        gap: 1.25rem;
    }

    @media (min-width: 640px) {
        .hero-content {
            padding: 2rem;
            gap: 1.5rem;
        }
    }

    @media (min-width: 1024px) {
        .hero-content {
            padding: 2.5rem;
            gap: 2rem;
        }
    }

    /* Poster Section */
    .poster-section {
        position: relative;
        flex-shrink: 0;
    }

    .poster-wrapper {
        width: 100px;
    }

    @media (min-width: 640px) {
        .poster-wrapper {
            width: 130px;
        }
    }

    @media (min-width: 1024px) {
        .poster-wrapper {
            width: 150px;
        }
    }

    .rating-position {
        position: absolute;
        top: -10px;
        right: -10px;
        z-index: 10;
    }

    /* Actions Panel */
    .actions-panel {
        flex: 1;
        display: flex;
        align-items: flex-end;
    }

    .actions-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow:
            0 24px 48px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        max-width: fit-content;
    }

    .media-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1.2;
        max-width: 280px;
    }

    @media (min-width: 640px) {
        .media-title {
            font-size: 1.5rem;
            max-width: 360px;
        }
    }

    @media (min-width: 1024px) {
        .media-title {
            font-size: 1.75rem;
            max-width: 480px;
        }
    }

    .actions-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 2.75rem;
        padding: 0 1.5rem;
        background: #facc15;
        color: black;
        font-size: 0.875rem;
        font-weight: 800;
        border-radius: 14px;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25);
    }

    .btn-primary:hover {
        transform: scale(1.03);
        box-shadow: 0 8px 24px rgba(250, 204, 21, 0.35);
    }

    .btn-primary:active {
        transform: scale(0.97);
    }

    .btn-secondary {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        height: 2.75rem;
        padding: 0 1rem;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.8125rem;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
    }

    .btn-secondary:active {
        transform: scale(0.97);
    }

    .divider {
        width: 1px;
        height: 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 0.25rem;
    }

    .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.75rem;
        height: 2.75rem;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-icon:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .btn-icon:active {
        transform: scale(0.95);
    }

    .btn-icon.active {
        background: rgba(250, 204, 21, 0.15);
        color: #facc15;
        border-color: rgba(250, 204, 21, 0.3);
    }

    .btn-icon.busy {
        opacity: 0.6;
        pointer-events: none;
    }

    .type-label {
        display: flex;
        align-items: center;
        height: 2.75rem;
        padding-left: 0.75rem;
    }

    .type-label span {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        font-size: 0.625rem;
        font-weight: 800;
        letter-spacing: 0.2em;
        color: rgba(255, 255, 255, 0.2);
    }

    /* Tabs Section */
    .tabs-section {
        width: 100%;
    }

    .tabs-container {
        background: rgba(10, 10, 10, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 1.5rem;
    }

    .tab-nav {
        display: flex;
        gap: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding-bottom: 0.75rem;
        margin-bottom: 1.5rem;
        overflow-x: auto;
    }

    .tab-btn {
        position: relative;
        background: none;
        border: none;
        padding: 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.2s;
    }

    .tab-btn:hover {
        color: rgba(255, 255, 255, 0.7);
    }

    .tab-btn.active {
        color: #facc15;
    }

    .tab-indicator {
        position: absolute;
        bottom: -0.75rem;
        left: 0;
        right: 0;
        height: 2px;
        background: #facc15;
        border-radius: 1px;
    }

    .tab-content {
        max-height: 500px;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .tab-content::-webkit-scrollbar {
        width: 4px;
    }

    .tab-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .tab-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    /* Overview Content */
    .overview-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .overview-text {
        font-size: 0.9375rem;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
    }

    .metadata-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    @media (min-width: 640px) {
        .metadata-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    .meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .meta-item.full-width {
        grid-column: 1 / -1;
    }

    .meta-label {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.4);
    }

    .meta-value {
        font-size: 0.875rem;
        font-weight: 500;
        color: #60a5fa;
    }
</style>
