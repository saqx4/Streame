<script lang="ts">
  import { link } from "svelte-spa-router";
  import { Play } from "lucide-svelte";
</script>

<header
  class="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur"
>
  <div
    class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
  >
    <a use:link href="/" class="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="Streame"
        class="h-9 w-9 rounded-xl shadow-lg ring-1 ring-white/10"
      />
      <span class="text-xl font-extrabold tracking-tight text-white"
        >Streame</span
      >
    </a>

    <nav class="flex items-center gap-3 text-sm">
      <a
        use:link
        href="/"
        class="rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white"
        >Home</a
      >
      <a
        use:link
        href="/movies"
        class="rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white"
        >Movies</a
      >
    </nav>
  </div>
</header>
