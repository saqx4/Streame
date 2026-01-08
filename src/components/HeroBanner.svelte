<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { link } from "svelte-spa-router";
    import { getBackdropUrl, getPosterUrl } from "../services/tmdb";
    import RatingBadge from "./RatingBadge.svelte";
    import MediaActions from "./MediaActions.svelte";
    import PosterOverlay from "./PosterOverlay.svelte";

    export let item: any;
    export let type: "movie" | "tv";
    export let isInWatchlist: boolean = false;
    export let watchlistBusy: boolean = false;

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    $: title = item?.title || item?.name || "";
    $: backdropUrl = getBackdropUrl(item?.backdrop_path, "original");
    $: posterUrl = getPosterUrl(item?.poster_path, "w500");
    $: rating = item?.vote_average ?? null;
    $: watchHref = `/watch/${type}/${item?.id}`;
    $: detailHref = type === "movie" ? `/movie/${item?.id}` : `/tv/${item?.id}`;
</script>

<div class="hero-banner" in:fade={{ duration: 400, easing: cubicOut }}>
    <!-- Backdrop Image -->
    <div class="backdrop">
        {#if item?.backdrop_path}
            <img src={backdropUrl} alt={title} class="backdrop-image" />
        {/if}

        <!-- Vignette Overlays -->
        <div class="vignette-bottom"></div>
        <div class="vignette-left"></div>
        <div class="vignette-radial"></div>
    </div>

    <!-- Content Layer -->
    <div class="content">
        <!-- Poster Thumbnail -->
        <div
            class="poster-container"
            in:scale={{ duration: 500, delay: 100, easing: cubicOut }}
        >
            <div class="poster-wrapper">
                <PosterOverlay {posterUrl} alt={title} />
            </div>

            <!-- Rating Badge -->
            {#if rating}
                <div class="rating-position">
                    <RatingBadge {rating} size="md" />
                </div>
            {/if}
        </div>

        <!-- Info Panel -->
        <div
            class="info-panel"
            in:fade={{ duration: 400, delay: 200, easing: cubicOut }}
        >
            <MediaActions
                {watchHref}
                {title}
                {type}
                {isInWatchlist}
                {watchlistBusy}
                on:toggleWatchlist={() => dispatch("toggleWatchlist")}
                on:share={() => dispatch("share")}
                on:trailer={() => dispatch("trailer")}
            />
        </div>
    </div>
</div>

<style>
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
            height: 600px;
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
            rgba(0, 0, 0, 0.7) 15%,
            rgba(0, 0, 0, 0.3) 35%,
            transparent 60%
        );
    }

    .vignette-left {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.2) 25%,
            transparent 50%
        );
    }

    .vignette-radial {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse 120% 100% at 50% 100%,
            rgba(0, 0, 0, 0.4) 0%,
            transparent 50%
        );
    }

    /* Content Layer */
    .content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-end;
        padding: 1.5rem;
        gap: 1.25rem;
    }

    @media (min-width: 640px) {
        .content {
            padding: 2rem;
            gap: 1.5rem;
        }
    }

    @media (min-width: 1024px) {
        .content {
            padding: 2.5rem;
            gap: 2rem;
        }
    }

    /* Poster Container */
    .poster-container {
        position: relative;
        flex-shrink: 0;
    }

    .poster-wrapper {
        width: 110px;
    }

    @media (min-width: 640px) {
        .poster-wrapper {
            width: 140px;
        }
    }

    @media (min-width: 1024px) {
        .poster-wrapper {
            width: 160px;
        }
    }

    .rating-position {
        position: absolute;
        top: -12px;
        right: -12px;
        z-index: 10;
    }

    /* Info Panel */
    .info-panel {
        flex: 1;
        display: flex;
        align-items: flex-end;
    }
</style>
