<script lang="ts">
  import { getPosterUrl } from "../services/tmdb";
  import { link } from "svelte-spa-router";
  import { Play } from "lucide-svelte";

  export let title: string;
  export let posterPath: string | null;
  export let href: string;
  export let meta: string | null = null;

  $: imageSrc = getPosterUrl(posterPath, "w342");
</script>

<a use:link {href} class="group w-[140px] shrink-0 sm:w-[160px]">
  <div
    class="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-white/[0.02] ring-1 ring-white/10 transition-all duration-500 group-hover:ring-accent/40 group-hover:scale-[1.05] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
  >
    <img
      src={imageSrc}
      alt={title}
      class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      loading="lazy"
    />
    
    <!-- Sophisticated Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80"></div>
    
    <!-- Quick Actions / Hover Info -->
    <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-2xl shadow-accent/40 transition-transform duration-500 scale-75 group-hover:scale-100">
        <Play size={20} fill="currentColor" />
      </div>
    </div>
    
    <!-- Shine Effect -->
    <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
      <div class="absolute inset-0 -translate-x-full rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
    </div>
  </div>

  <div class="mt-3 px-1">
    <div class="line-clamp-1 text-[13px] font-bold tracking-tight text-white/90 transition-colors duration-300 group-hover:text-accent">
      {title}
    </div>
    {#if meta}
      <div class="mt-1 flex items-center gap-2">
        <span class="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/40 ring-1 ring-white/10 group-hover:text-white/60">
          {meta}
        </span>
      </div>
    {/if}
  </div>
</a>
