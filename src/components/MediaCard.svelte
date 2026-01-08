<script lang="ts">
  import { getPosterUrl } from "../services/tmdb";
  import { link } from "svelte-spa-router";

  export let title: string;
  export let posterPath: string | null;
  export let href: string;
  export let meta: string | null = null;

  $: imageSrc = getPosterUrl(posterPath, "w342");
</script>

<a use:link {href} class="group w-[145px] shrink-0">
  <div
    class="relative overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition-all duration-200 group-hover:ring-white/20 group-hover:scale-[1.02]"
  >
    <div class="aspect-[2/3] overflow-hidden">
      <img
        src={imageSrc}
        alt={title}
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  </div>

  <div class="mt-2">
    <div class="line-clamp-1 text-[13px] font-medium text-white/90">
      {title}
    </div>
    {#if meta}
      <div class="mt-0.5 line-clamp-1 text-[11px] text-white/50">{meta}</div>
    {/if}
  </div>
</a>
