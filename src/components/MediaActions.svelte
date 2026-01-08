<script lang="ts">
    import { link } from "svelte-spa-router";
    import { Play, Film, Bookmark, Share2 } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let watchHref: string;
    export let title: string;
    export let type: "movie" | "tv" = "movie";
    export let isInWatchlist: boolean = false;
    export let watchlistBusy: boolean = false;

    const dispatch = createEventDispatcher();

    const handleWatchlistClick = () => dispatch("toggleWatchlist");
    const handleShareClick = () => dispatch("share");
    const handleTrailerClick = () => dispatch("trailer");
</script>

<div class="media-actions">
    <!-- Title -->
    <h1 class="media-title">{title}</h1>

    <!-- Actions Row -->
    <div class="actions-row">
        <!-- Primary Watch Button -->
        <a use:link href={watchHref} class="btn-primary">
            <Play size={16} fill="currentColor" />
            <span>Watch</span>
        </a>

        <!-- Trailer Button -->
        <button class="btn-secondary" on:click={handleTrailerClick}>
            <Film size={14} />
            <span>Trailers</span>
        </button>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Watchlist Button -->
        <button
            class="btn-icon"
            class:active={isInWatchlist}
            class:busy={watchlistBusy}
            on:click={handleWatchlistClick}
            aria-label="Toggle watchlist"
        >
            <Bookmark size={18} />
        </button>

        <!-- Share Button -->
        <button class="btn-icon" on:click={handleShareClick} aria-label="Share">
            <Share2 size={18} />
        </button>

        <!-- Type Label -->
        <div class="type-label">
            <span>{type === "movie" ? "MOVIE" : "SHOW"}</span>
        </div>
    </div>
</div>

<style>
    .media-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow:
            0 24px 48px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        max-width: fit-content;
    }

    .media-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1.2;
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (min-width: 640px) {
        .media-title {
            font-size: 1.75rem;
            max-width: 360px;
        }
    }

    .actions-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
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
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
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
        color: rgba(255, 255, 255, 0.25);
    }
</style>
