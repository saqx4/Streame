<script lang="ts">
  import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-svelte'
  import MediaCard from './MediaCard.svelte'

  type CarouselItem = {
    id: number
    title: string
    posterPath: string | null
    href: string
    meta?: string | null
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

<section class="space-y-3">
  <div class="flex items-center justify-between px-1">
    <div class="flex items-center gap-3">
      <h2 class="text-[22px] font-bold tracking-tight text-white/90">{title}</h2>
      {#if items.length > 0}
        <span class="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold text-yellow-400 ring-1 ring-yellow-400/20">
          {items.length}
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <div class="hidden items-center gap-1.5 sm:flex">
        <button
          class="group inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-yellow-400 hover:ring-yellow-400 hover:text-black transition-all duration-200 active:scale-95"
          on:click={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} class="transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button
          class="group inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-yellow-400 hover:ring-yellow-400 hover:text-black transition-all duration-200 active:scale-95"
          on:click={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} class="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  </div>

  {#if chips.length}
    <div class="flex flex-wrap gap-2 px-1">
      {#each chips as c (c)}
        <span class="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer">{c}</span>
      {/each}
    </div>
  {/if}

  <div class="relative">
    <!-- Gradient fade edges -->
    <div class="pointer-events-none absolute left-0 top-0 bottom-3 z-10 w-12 bg-gradient-to-r from-[#050505] to-transparent"></div>
    <div class="pointer-events-none absolute right-0 top-0 bottom-3 z-10 w-12 bg-gradient-to-l from-[#050505] to-transparent"></div>
    
    <div
      bind:this={scroller}
      class="no-scrollbar flex gap-4 overflow-x-auto pb-3 pr-2 pl-1"
    >
      {#if loading}
        {#each Array(skeletonCount) as _, i (i)}
          <div class="w-[145px] shrink-0">
            <div class="aspect-[2/3] animate-pulse rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] ring-1 ring-white/5"></div>
            <div class="mt-2.5 space-y-1.5">
              <div class="h-3 w-[120px] animate-pulse rounded-lg bg-white/5"></div>
              <div class="h-2 w-[60px] animate-pulse rounded-lg bg-white/5"></div>
            </div>
          </div>
        {/each}
      {:else}
        {#each items as item (item.id)}
          <MediaCard title={item.title} posterPath={item.posterPath} href={item.href} meta={item.meta ?? null} />
        {/each}
      {/if}
    </div>
  </div>
</section>
