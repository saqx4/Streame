<script lang="ts">
    import { link } from "svelte-spa-router";
    import { fade, scale, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import {
        Play,
        Bookmark,
        Share2,
        Film,
        Calendar,
        Clock,
        Clapperboard,
        Tv,
        Activity,
        Layers,
        Globe,
        MapPin,
        Building2,
        Star,
        Info
    } from "lucide-svelte";
    import {
        getBackdropUrl,
        getPosterUrl,
        tmdbService,
    } from "../services/tmdb";
    import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
    import { userMediaService } from "../services/userMedia";
    import { redirectToLogin } from "../lib/loginRedirect";
    import { onMount, onDestroy } from "svelte";
    import TrailerModal from "./TrailerModal.svelte";

    export let item: any;
    export let type: "movie" | "tv";
    export let activeTab: string = "overview";

    const LOCAL_WATCHLIST_KEY = "streame:watchlist";

    let userId: string | null = null;
    let isInWatchlist = false;
    let watchlistBusy = false;

    // Logo state
    let logoUrl: string | null = null;
    let loadingLogo = true;

    // Backdrop gallery slideshow
    let backdropImages: string[] = [];
    let currentBackdropIndex = 0;
    let backdropTimer: ReturnType<typeof setInterval> | null = null;
    const BACKDROP_INTERVAL = 8000;

    let trailerKey = "";
    let showTrailer = false;

    $: title = (type === "movie" ? item?.title : item?.name) ?? "";
    $: rating = item?.vote_average ?? null;
    $: watchHref = `/watch/${type}/${item?.id}`;
    $: currentBackdrop =
        backdropImages.length > 0
            ? backdropImages[currentBackdropIndex]
            : getBackdropUrl(item?.backdrop_path, "original");

    const loadLogo = async () => {
        if (!item?.id) return;
        loadingLogo = true;
        try {
            const res = type === "movie" 
                ? await tmdbService.getMovieImages(item.id) 
                : await tmdbService.getTVShowImages(item.id);
            
            const logo = res.logos.find((l: any) => l.iso_639_1 === "en") || res.logos[0];
            logoUrl = logo ? `https://image.tmdb.org/t/p/original${logo.file_path}` : null;
        } catch (e) {
            logoUrl = null;
        } finally {
            loadingLogo = false;
        }
    };

    const loadBackdropGallery = async () => {
        if (!item?.id) return;
        try {
            const images = type === "movie"
                ? await tmdbService.getMovieImages(item.id)
                : await tmdbService.getTVShowImages(item.id);

            if (images?.backdrops?.length > 0) {
                const sortedBackdrops = [...images.backdrops]
                    .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
                    .slice(0, 8);

                const mainBackdrop = getBackdropUrl(item.backdrop_path, "original");
                const galleryBackdrops = sortedBackdrops
                    .filter((b: any) => b.file_path !== item.backdrop_path)
                    .map((b: any) => getBackdropUrl(b.file_path, "original"));

                backdropImages = [mainBackdrop, ...galleryBackdrops];
                if (backdropImages.length > 1) startBackdropRotation();
            }
        } catch (e) {
            backdropImages = item?.backdrop_path ? [getBackdropUrl(item.backdrop_path, "original")] : [];
        }
    };

    const startBackdropRotation = () => {
        if (backdropTimer) clearInterval(backdropTimer);
        backdropTimer = setInterval(() => {
            currentBackdropIndex = (currentBackdropIndex + 1) % backdropImages.length;
        }, BACKDROP_INTERVAL);
    };

    const stopBackdropRotation = () => {
        if (backdropTimer) clearInterval(backdropTimer);
    };

    const refreshWatchlistState = async () => {
        try {
            if (isSupabaseEnabled) {
                const { data } = await supabase.auth.getUser();
                userId = data?.user?.id ?? null;
                if (userId) {
                    isInWatchlist = await userMediaService.has(userId, Number(item?.id ?? 0), "watchlist");
                    return;
                }
            }
            const local = JSON.parse(localStorage.getItem(LOCAL_WATCHLIST_KEY) || "[]");
            isInWatchlist = local.some((x: any) => Number(x?.tmdb_id) === Number(item?.id ?? 0));
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
                    await userMediaService.add(userId, { tmdb_id: tmdbId, type, title, poster_path: item?.poster_path ?? null }, "watchlist");
                    isInWatchlist = true;
                }
            } else {
                let local = JSON.parse(localStorage.getItem(LOCAL_WATCHLIST_KEY) || "[]");
                if (isInWatchlist) local = local.filter((x: any) => Number(x?.tmdb_id) !== tmdbId);
                else local.push({ tmdb_id: tmdbId, type, title, poster_path: item?.poster_path ?? null });
                localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(local));
                isInWatchlist = !isInWatchlist;
            }
        } finally {
            watchlistBusy = false;
        }
    };

    const formatRuntime = (minutes: number) => {
        if (!minutes) return "";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const handleTrailer = async () => {
        try {
            const data = type === "movie" ? await tmdbService.getMovieVideos(item.id) : await tmdbService.getTVShowVideos(item.id);
            const trailer = data.results.find((v: any) => v.type === "Trailer" && v.site === "YouTube") || data.results[0];
            if (trailer) { trailerKey = trailer.key; showTrailer = true; }
        } catch (e) { console.error(e); }
    };

    onMount(() => {
        refreshWatchlistState();
        loadBackdropGallery();
        loadLogo();
    });

    onDestroy(stopBackdropRotation);

    const tabs = [
        { id: "episodes", label: "Episodes", show: type === "tv" },
        { id: "overview", label: "Overview", show: true },
        { id: "casts", label: "Casts", show: true },
        { id: "reviews", label: "Reviews", show: true },
        { id: "related", label: "Related", show: true },
    ];
    $: visibleTabs = tabs.filter((t) => t.show);
</script>

<div class="detail-container">
    <!-- Immersive Stage Hero -->
    <header class="stage-hero">
        <div class="stage-backdrop">
            {#key currentBackdropIndex}
                <img src={currentBackdrop} alt={title} class="backdrop-img" in:fade={{ duration: 1200 }} out:fade={{ duration: 800 }} />
            {/key}
            <div class="scrim-v"></div>
            <div class="scrim-h"></div>
            <div class="scrim-radial"></div>
        </div>

        <div class="stage-content">
            <div class="content-wrapper" in:fly={{ y: 40, duration: 1000, delay: 200 }}>
                <!-- Logo or Title -->
                <div class="title-area">
                    {#if logoUrl}
                        <img src={logoUrl} alt={title} class="movie-logo" in:scale={{ duration: 800, delay: 400, start: 0.95 }} />
                    {:else}
                        <h1 class="movie-title">{title}</h1>
                    {/if}
                </div>

                <!-- Metadata Row -->
                <div class="meta-row">
                    {#if rating}
                        <div class="rating-badge">
                            <Star size={14} fill="currentColor" />
                            <span>{rating.toFixed(1)}</span>
                        </div>
                    {/if}
                    <span class="meta-item">{(item.release_date || item.first_air_date || "").slice(0, 4)}</span>
                    {#if item.runtime || (item.episode_run_time && item.episode_run_time[0])}
                        <span class="dot"></span>
                        <span class="meta-item">{formatRuntime(item.runtime || item.episode_run_time[0])}</span>
                    {/if}
                    <span class="dot"></span>
                    <span class="meta-item uppercase tracking-widest">{type}</span>
                </div>

                <!-- Tags / Genres -->
                <div class="genre-row">
                    {#each (item.genres || []).slice(0, 3) as g}
                        <span class="genre-tag">{g.name}</span>
                    {/each}
                </div>

                <!-- Overview Snippet -->
                <p class="overview-snippet">{item.overview}</p>

                <!-- Actions Stage -->
                <div class="actions-stage">
                    <a use:link href={watchHref} class="btn-watch group">
                        <Play size={24} fill="currentColor" class="transition-transform group-hover:scale-110" />
                        <span>Watch Now</span>
                    </a>
                    
                    <button on:click={handleTrailer} class="btn-glass">
                        <Film size={20} />
                        <span>Trailer</span>
                    </button>

                    <button on:click={toggleWatchlist} class="btn-icon-glass" class:active={isInWatchlist}>
                        <Bookmark size={22} fill={isInWatchlist ? "currentColor" : "none"} />
                    </button>

                    <button on:click={() => {}} class="btn-icon-glass">
                        <Share2 size={22} />
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Content Area -->
    <main class="content-stage">
        <nav class="stage-tabs">
            {#each visibleTabs as tab}
                <button class="tab-item" class:active={activeTab === tab.id} on:click={() => (activeTab = tab.id)}>
                    {tab.label}
                    {#if activeTab === tab.id}
                        <div class="active-indicator" layout:id="active"></div>
                    {/if}
                </button>
            {/each}
        </nav>

        <div class="tab-viewport">
            {#if activeTab === "overview"}
                <div class="overview-grid" in:fade>
                    <div class="main-info">
                        {#if item.tagline}
                            <h3 class="tagline">"{item.tagline}"</h3>
                        {/if}
                        <p class="full-overview">{item.overview}</p>
                    </div>
                    <aside class="side-info">
                        <div class="info-card">
                            <span class="info-label">Status</span>
                            <span class="info-value">{item.status}</span>
                        </div>
                        {#if item.number_of_seasons}
                            <div class="info-card">
                                <span class="info-label">Seasons</span>
                                <span class="info-value">{item.number_of_seasons}</span>
                            </div>
                        {/if}
                        <div class="info-card">
                            <span class="info-label">Original Language</span>
                            <span class="info-value uppercase">{item.original_language}</span>
                        </div>
                        <div class="info-card">
                            <span class="info-label">Production</span>
                            <span class="info-value">{(item.production_companies || [])[0]?.name || "—"}</span>
                        </div>
                    </aside>
                </div>
            {:else}
                <slot name="tab-content" {activeTab}></slot>
            {/if}
        </div>
    </main>

    {#if showTrailer}
        <TrailerModal videoKey={trailerKey} title={title} on:close={() => (showTrailer = false)} />
    {/if}
</div>

<style>
    .detail-container {
        min-height: 100vh;
        background: #050505;
        color: white;
    }

    /* Immersive Hero */
    .stage-hero {
        position: relative;
        height: 85vh;
        min-height: 600px;
        width: 100%;
        overflow: hidden;
    }

    @media (max-width: 640px) {
        .stage-hero {
            height: 70vh;
            min-height: 500px;
        }
    }

    .stage-backdrop {
        position: absolute;
        inset: 0;
        z-index: 0;
    }

    .backdrop-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 15%;
        transform: scale(1.02);
    }

    /* Sophisticated Fades */
    .scrim-v {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, 
            #050505 0%, 
            #050505 5%, 
            rgba(5, 5, 5, 0.8) 15%, 
            rgba(5, 5, 5, 0.2) 40%, 
            transparent 70%
        );
    }

    .scrim-h {
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, 
            #050505 0%, 
            rgba(5, 5, 5, 0.9) 10%, 
            rgba(5, 5, 5, 0.4) 30%, 
            transparent 60%
        );
    }

    .scrim-radial {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 40%, rgba(5, 5, 5, 0) 0%, rgba(5, 5, 5, 0.4) 100%);
    }

    /* Content Layout */
    .stage-content {
        position: relative;
        z-index: 10;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 4rem 6rem;
        max-width: 1600px;
        margin: 0 auto;
    }

    @media (max-width: 1024px) {
        .stage-content { padding: 3rem 2rem; }
    }

    @media (max-width: 640px) {
        .stage-content { padding: 2.5rem 1.25rem; }
    }

    .content-wrapper {
        max-width: 850px;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
    }

    .movie-logo {
        max-width: 500px;
        max-height: 220px;
        object-fit: contain;
        filter: drop-shadow(0 0 40px rgba(0,0,0,0.7));
    }

    .movie-title {
        font-size: 5rem;
        font-weight: 900;
        letter-spacing: -0.04em;
        line-height: 0.95;
        text-shadow: 0 10px 50px rgba(0,0,0,0.8);
        background: linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.7));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    @media (max-width: 1024px) {
        .movie-title { font-size: 4rem; }
        .movie-logo { max-width: 400px; max-height: 180px; }
    }

    @media (max-width: 768px) {
        .movie-title { font-size: 3.25rem; }
        .movie-logo { max-width: 320px; max-height: 140px; }
    }

    @media (max-width: 480px) {
        .movie-title { font-size: 2.5rem; }
        .movie-logo { max-width: 240px; max-height: 110px; }
    }

    .meta-row {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: rgba(255,255,255,0.8);
    }

    .rating-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(250, 204, 21, 0.1);
        color: #facc15;
        padding: 0.25rem 0.75rem;
        border-radius: 10px;
        border: 1px solid rgba(250, 204, 21, 0.2);
    }

    .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
    }

    .genre-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.875rem;
    }

    .genre-tag {
        padding: 0.5rem 1.25rem;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        font-size: 0.9375rem;
        font-weight: 700;
        backdrop-filter: blur(12px);
        transition: all 0.3s;
    }

    .genre-tag:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }

    .overview-snippet {
        font-size: 1.25rem;
        line-height: 1.6;
        color: rgba(255,255,255,0.7);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 700px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    /* Modern Actions */
    .actions-stage {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
    }

    @media (max-width: 480px) {
        .actions-stage { gap: 1rem; }
        .btn-watch { width: 100%; justify-content: center; }
    }

    .btn-watch {
        display: flex;
        align-items: center;
        gap: 1rem;
        height: 4.5rem;
        padding: 0 3.5rem;
        background: #facc15;
        color: black;
        border-radius: 24px;
        font-size: 1.25rem;
        font-weight: 900;
        text-decoration: none;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 15px 35px rgba(250, 204, 21, 0.3);
    }

    .btn-watch:hover {
        transform: scale(1.05) translateY(-3px);
        background: #fbbf24;
        box-shadow: 0 20px 45px rgba(250, 204, 21, 0.5);
    }

    .btn-glass {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        height: 4.5rem;
        padding: 0 2.25rem;
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        font-size: 1.125rem;
        font-weight: 800;
        color: white;
        transition: all 0.3s;
    }

    .btn-glass:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.25);
        transform: translateY(-2px);
    }

    .btn-icon-glass {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 4.5rem;
        width: 4.5rem;
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        color: white;
        transition: all 0.3s;
    }

    .btn-icon-glass:hover {
        background: rgba(255,255,255,0.15);
        color: #facc15;
        transform: translateY(-2px);
    }

    .btn-icon-glass.active {
        background: rgba(250, 204, 21, 0.15);
        border-color: rgba(250, 204, 21, 0.4);
        color: #facc15;
    }

    /* Content Stage */
    .content-stage {
        padding: 4rem 6rem;
        max-width: 1600px;
        margin: 0 auto;
    }

    @media (max-width: 1024px) {
        .content-stage { padding: 3rem 2rem; }
    }

    @media (max-width: 640px) {
        .content-stage { padding: 2.5rem 1.25rem; }
    }

    .stage-tabs {
        display: flex;
        gap: 4rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        margin-bottom: 4rem;
        overflow-x: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .stage-tabs::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: 640px) {
        .stage-tabs {
            gap: 2rem;
            margin-bottom: 2.5rem;
        }
        .tab-item {
            font-size: 1.125rem;
        }
    }

    .tab-item {
        position: relative;
        padding: 1.25rem 0;
        font-size: 1.375rem;
        font-weight: 800;
        color: rgba(255,255,255,0.4);
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.3s;
    }

    .tab-item:hover { color: white; }
    .tab-item.active { 
        color: white; 
        text-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
    }

    .active-indicator {
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 5px;
        background: #facc15;
        border-radius: 10px 10px 0 0;
        box-shadow: 0 0 20px rgba(250, 204, 21, 0.6);
    }

    /* Overview Styles */
    .overview-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 5rem;
    }

    @media (max-width: 1024px) {
        .overview-grid { gap: 3rem; }
    }

    @media (max-width: 768px) {
        .overview-grid { grid-template-columns: 1fr; gap: 3rem; }
    }

    .tagline {
        font-size: 2rem;
        font-weight: 800;
        font-style: italic;
        color: #facc15;
        margin-bottom: 2.5rem;
        opacity: 0.9;
        line-height: 1.3;
    }

    .full-overview {
        font-size: 1.375rem;
        line-height: 1.8;
        color: rgba(255,255,255,0.7);
    }

    .side-info {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
    }

    .info-card {
        padding: 1.75rem;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 28px;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        transition: all 0.3s;
    }

    .info-card:hover {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.1);
        transform: translateX(5px);
    }

    .info-label {
        font-size: 0.9375rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(255,255,255,0.3);
    }

    .info-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
    }
</style>
