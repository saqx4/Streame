<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let videoKey: string;
    export let title: string = "Trailer";

    const dispatch = createEventDispatcher();

    const close = () => dispatch("close");
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
    on:click={close}
    transition:fade={{ duration: 300 }}
>
    <div
        class="relative aspect-video w-full max-w-5xl overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10"
        on:click|stopPropagation
        transition:scale={{ start: 0.9, duration: 400, opacity: 0 }}
    >
        <!-- Header -->
        <div
            class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-6"
        >
            <h3 class="text-xl font-bold text-white drop-shadow-lg">{title}</h3>
            <button
                on:click={close}
                class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
            >
                <X size={24} />
            </button>
        </div>

        <!-- YouTube Iframe -->
        <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            {title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            class="h-full w-full"
        ></iframe>
    </div>
</div>
