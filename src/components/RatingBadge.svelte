<script lang="ts">
    export let rating: number | null = null;
    export let size: "sm" | "md" | "lg" = "md";

    $: displayRating = rating ? rating.toFixed(1) : "—";

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
    };
</script>

<div
    class="rating-badge {sizeClasses[size]}"
    class:has-rating={rating !== null}
>
    {displayRating}
</div>

<style>
    .rating-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 800;
        color: #facc15;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .rating-badge:hover {
        transform: scale(1.05);
    }

    .has-rating {
        background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.9),
            rgba(20, 20, 20, 0.9)
        );
    }
</style>
