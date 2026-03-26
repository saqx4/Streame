<script lang="ts">
  import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-svelte'
  import MediaCard from './MediaCard.svelte'

  type CarouselItem = {
    id: number
    title: string
    posterPath: string | null
    backdropPath?: string | null
    href: string
    meta?: string | null
    rating?: number | null
  }

  export let title: string
  export let items: CarouselItem[]
  export let chips: string[] = []
  export let loading: boolean = false
  export let skeletonCount: number = 10

  let scroller: HTMLDivElement | null = null

  const scrollByAmount = (dir: -1 | 1) => {
    if (!scroller) return
    scroller.scrollBy({ left: dir * 420, behavior: 'smooth' })
  }
</script>

<section class="space-y-6 animate-in">
  <div class="flex items-end justify-between px-2">
    <div class="space-y-1">
      {#if chips.length > 0}
         <div class="flex flex-wrap gap-2 pb-1">
          {#each chips as c (c)}
            <span class="rounded-lg bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/40 ring-1 ring-white/10 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer">{c}</span>
          {/each}
        </div>
      {/if}
      <div class="flex items-center gap-2.5">
        <h2 class="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
        {#if items.length > 0}
          <div class="h-1 w-1 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center gap-2 pb-1">
      <div class="hidden items-center gap-1.5 sm:flex">
        <button
          class="group inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/5 ring-1 ring-white/10 hover:bg-accent hover:ring-accent hover:text-black transition-all duration-300 active:scale-95"
          on:click={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} class="transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button
          class="group inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/5 ring-1 ring-white/10 hover:bg-accent hover:ring-accent hover:text-black transition-all duration-300 active:scale-95"
          on:click={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} class="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  </div>

  <div class="relative group/carousel">
    <!-- Gradient edges -->
    <div class="pointer-events-none absolute -left-1 top-0 bottom-0 z-10 w-20 bg-gradient-to-r from-[#050505] to-transparent"></div>
    <div class="pointer-events-none absolute -right-1 top-0 bottom-0 z-10 w-20 bg-gradient-to-l from-[#050505] to-transparent"></div>
    
    <div
      bind:this={scroller}
      class="no-scrollbar flex gap-6 overflow-x-auto pb-8 pr-4 pl-2 pt-2 transition-all"
    >
      {#if loading}
        {#each Array(skeletonCount) as _, i (i)}
          <div class="w-[240px] shrink-0 sm:w-[280px] lg:w-[320px]">
            <div class="aspect-video animate-pulse rounded-2xl bg-gradient-to-br from-white/5 to-transparent ring-1 ring-white/5"></div>
            <div class="mt-4 space-y-2">
              <div class="h-4 w-[180px] animate-pulse rounded-lg bg-white/5"></div>
              <div class="h-3 w-[100px] animate-pulse rounded-lg bg-white/5"></div>
            </div>
          </div>
        {/each}
      {:else}
        {#each items as item (item.id)}
          <MediaCard 
            title={item.title} 
            posterPath={item.posterPath} 
            backdropPath={item.backdropPath}
            href={item.href} 
            meta={item.meta ?? null} 
            rating={item.rating ?? null} 
          />
        {/each}
      {/if}
    </div>
  </div>
</section>
