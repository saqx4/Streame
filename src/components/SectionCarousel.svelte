<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
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

<section class="space-y-2">
  <div class="flex items-center justify-between">
    <h2 class="text-[22px] font-semibold tracking-tight text-white/90">{title}</h2>
    <div class="flex items-center gap-1 text-xs text-white/60">
      <div class="hidden items-center gap-1 sm:flex">
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
          on:click={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
          on:click={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  </div>

  {#if chips.length}
    <div class="flex flex-wrap gap-2">
      {#each chips as c (c)}
        <span class="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60 ring-1 ring-white/10">{c}</span>
      {/each}
    </div>
  {/if}

  <div
    bind:this={scroller}
    class="no-scrollbar flex gap-4 overflow-x-auto pb-3 pr-2"
  >
    {#if loading}
      {#each Array(skeletonCount) as _, i (i)}
        <div class="w-[145px] shrink-0">
          <div class="aspect-[2/3] animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10"></div>
          <div class="mt-2 h-3 w-[120px] animate-pulse rounded bg-white/5"></div>
        </div>
      {/each}
    {:else}
      {#each items as item (item.id)}
        <MediaCard title={item.title} posterPath={item.posterPath} href={item.href} meta={item.meta ?? null} />
      {/each}
    {/if}
  </div>
</section>
