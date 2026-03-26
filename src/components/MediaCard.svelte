<script lang="ts">
  import { getBackdropUrl, getPosterUrl } from "../services/tmdb";
  import { link } from "svelte-spa-router";
  import { Play, Star } from "lucide-svelte";

  export let title: string;
  export let posterPath: string | null;
  export let backdropPath: string | null = null;
  export let href: string;
  export let meta: string | null = null;
  export let rating: number | null = null;
  export let progress: number | null = null;
  export let remaining: string | null = null;
  let className = "";
  export { className as class };

  // Prefer backdrop for the landscape rectangle style
  $: imageSrc = backdropPath 
    ? getBackdropUrl(backdropPath, "w780") 
    : getPosterUrl(posterPath, "w500");
</script>

<a 
  use:link 
  {href} 
  class="group relative block transition-all duration-500 ease-out {className || 'w-[240px] shrink-0 sm:w-[280px] lg:w-[320px]'}"
  {...$$restProps}
>
  <div
    class="relative aspect-video overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10 transition-all duration-500 group-hover:border-accent/50 group-hover:scale-[1.02] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
  >
    <!-- Background Image with Zoom Effect -->
    <img
      src={imageSrc}
      alt={title}
      class="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
      loading="lazy"
    />
    
    <!-- Gradient Overlays -->
    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-60"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
    
    <!-- Top Badges -->
    <div class="absolute top-3 left-3 flex items-center gap-2">
      {#if rating}
        <div class="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-accent backdrop-blur-md border border-white/10">
          <Star size={10} fill="currentColor" />
          <span>{rating.toFixed(1)}</span>
        </div>
      {/if}
      {#if meta}
        <div class="rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white/70 backdrop-blur-md border border-white/5">
          {meta}
        </div>
      {/if}
    </div>

    {#if remaining}
      <div class="absolute top-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-black text-accent backdrop-blur-md border border-white/10">
        {remaining}
      </div>
    {/if}

    <!-- Quick Action Overlay -->
    <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-transform duration-500 hover:scale-110">
        <Play size={20} fill="currentColor" />
      </div>
    </div>
    
    <!-- Edge Highlight Shine -->
    <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
      <div class="absolute inset-0 -translate-x-full rotate-[35deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-[200%]"></div>
    </div>

    <!-- Progress Bar -->
    {#if progress !== null}
      <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-md">
        <div 
          class="h-full bg-accent shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-1000 ease-out"
          style="width: {progress}%"
        ></div>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="mt-4 px-1 space-y-1">
    <div class="flex items-center justify-between gap-2">
      <h3 class="line-clamp-1 text-[15px] font-bold tracking-tight text-white/90 transition-colors duration-300 group-hover:text-accent">
        {title}
      </h3>
      <span class="shrink-0 text-[10px] font-black uppercase tracking-widest text-accent/60 group-hover:text-accent transition-colors">
        Watch
      </span>
    </div>
  </div>
</a>

<style>
  /* Optional: Add custom animations or overrides */
</style>
