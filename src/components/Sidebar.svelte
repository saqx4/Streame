<script lang="ts">
  import { link, location } from "svelte-spa-router";
  import { Home, Search, Film, Tv, Heart, Settings } from "lucide-svelte";

  const isActive = (p: string, current: string) => {
    if (p === "/") return current === "/";
    return current.startsWith(p);
  };
</script>

<!-- Desktop Sidebar -->
<aside
  class="fixed left-0 top-0 z-50 hidden h-screen w-[60px] border-r border-white/5 bg-black/40 backdrop-blur-2xl sm:block"
>
  <div class="flex h-full flex-col items-center gap-2 py-3">
    <a
      use:link
      href="/"
      class={`group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="Home"
    >
      <Home size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/search"
      class={`group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="Search"
    >
      <Search size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/movies"
      class={`group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="Movies"
    >
      <Film size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="TV Shows"
    >
      <Tv size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/watchlist"
      class={`group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="Watchlist"
    >
      <Heart size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <div class="flex-1"></div>

    <a
      use:link
      href="/settings"
      class={`group mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive("/settings", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 ring-1 ring-yellow-400"
          : "bg-white/5 text-white/60 ring-1 ring-white/5 hover:bg-white/10 hover:text-white hover:ring-white/10"
      }`}
      aria-label="Settings"
    >
      <Settings size={18} class="transition-transform group-hover:scale-110" />
    </a>
  </div>
</aside>

<!-- Mobile Navigation -->
<nav
  class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-black/60 backdrop-blur-2xl sm:hidden"
  style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);"
>
  <div class="mx-auto grid max-w-[1400px] grid-cols-6 gap-1 px-2 pt-2">
    <a
      use:link
      href="/"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="Home"
    >
      <Home size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">Home</span>
    </a>

    <a
      use:link
      href="/search"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="Search"
    >
      <Search size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">Search</span>
    </a>

    <a
      use:link
      href="/movies"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="Movies"
    >
      <Film size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">Movies</span>
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="TV Shows"
    >
      <Tv size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">TV</span>
    </a>

    <a
      use:link
      href="/watchlist"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="Watchlist"
    >
      <Heart size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">List</span>
    </a>

    <a
      use:link
      href="/settings"
      class={`group flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
        isActive("/settings", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
      aria-label="Settings"
    >
      <Settings size={18} class="transition-transform group-active:scale-90" />
      <span class="mt-1">Settings</span>
    </a>
  </div>
</nav>
