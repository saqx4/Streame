<script lang="ts">
    export let posterUrl: string;
    export let alt: string = "";
</script>

<div class="poster-overlay">
    <img src={posterUrl} {alt} class="poster-image" loading="eager" />
    <div class="poster-glow"></div>
</div>

<style>
    .poster-overlay {
        position: relative;
        width: 100%;
        aspect-ratio: 2 / 3;
        border-radius: 20px;
        overflow: hidden;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: #111;
    }

    .poster-overlay:hover {
        transform: scale(1.02);
    }

    .poster-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .poster-glow {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.3) 0%,
            transparent 40%
        );
        pointer-events: none;
    }
</style>
