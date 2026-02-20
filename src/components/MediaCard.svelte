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

<a use:link {href} class="group w-[145px] shrink-0">
  <div
    class="relative overflow-hidden rounded-2xl bg-zinc-900/50 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-yellow-400/30 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-yellow-400/10"
  >
    <div class="aspect-[2/3] overflow-hidden">
      <img
        src={imageSrc}
        alt={title}
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
    </div>
    
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <!-- Play button overlay -->
    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shadow-2xl shadow-yellow-400/40">
        <Play size={20} fill="currentColor" />
      </div>
    </div>
    
    <!-- Shine effect -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  </div>

  <div class="mt-2.5 px-0.5">
    <div class="line-clamp-1 text-[13px] font-semibold text-white/90 group-hover:text-yellow-400 transition-colors duration-300">
      {title}
    </div>
    {#if meta}
      <div class="mt-1 line-clamp-1 text-[11px] font-medium text-white/40 group-hover:text-white/60 transition-colors duration-300">{meta}</div>
    {/if}
  </div>
</a>
