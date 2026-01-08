<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let src: string;
    export let alt: string = "";
    export let placeholder: string = "";
    export let className: string = "";
    export let eager: boolean = false;

    let loaded = false;
    let error = false;
    let containerElement: HTMLDivElement;

    // Use intersection observer for lazy loading
    let visible = eager;

    const handleLoad = () => {
        loaded = true;
    };

    const handleError = () => {
        error = true;
    };

    onMount(() => {
        if (eager) {
            visible = true;
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        visible = true;
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: "100px" },
        );

        if (containerElement) {
            observer.observe(containerElement);
        }

        return () => observer.disconnect();
    });
</script>

<div
    class="lazy-image-container {className}"
    bind:this={containerElement}
    style={placeholder && !loaded ? `background-image: url(${placeholder});` : ""}
>
    {#if !loaded && !error}
        <div class="skeleton" in:fade={{ duration: 150 }}></div>
    {/if}

    {#if visible}
        <img
            {src}
            {alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            on:load={handleLoad}
            on:error={handleError}
            class="lazy-image"
            class:loaded
            style={!loaded ? "opacity: 0" : ""}
        />
    {/if}
</div>

<style>
    .lazy-image-container {
        position: relative;
        overflow: hidden;
        background: #111;
    }

    .skeleton {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    .lazy-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.3s ease-out;
    }

    .lazy-image.loaded {
        opacity: 1;
    }
</style>
