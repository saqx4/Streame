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
  class="fixed left-3 top-1/2 z-50 hidden h-[fit-content] -translate-y-1/2 flex-col gap-1.5 rounded-[20px] border border-white/10 bg-black/40 p-1.5 backdrop-blur-3xl sm:flex"
>
  <div class="flex flex-col items-center gap-2">
    <a
      use:link
      href="/"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="Home"
    >
      <Home size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/search"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="Search"
    >
      <Search size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/movies"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="Movies"
    >
      <Film size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="TV Shows"
    >
      <Tv size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <a
      use:link
      href="/watchlist"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="Watchlist"
    >
      <Heart size={18} class="transition-transform group-hover:scale-110" />
    </a>

    <div class="h-px w-5 bg-white/10 my-0.5"></div>

    <a
      use:link
      href="/settings"
      class={`group flex h-10 w-10 items-center justify-center rounded-[14px] transition-all duration-300 ${
        isActive("/settings", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 scale-105"
          : "text-white/40 hover:bg-white/10 hover:text-white"
      }`}
      aria-label="Settings"
    >
      <Settings size={18} class="transition-transform group-hover:scale-110" />
    </a>
  </div>
</aside>

<!-- Mobile Navigation -->
<nav
  class="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-[28px] border border-white/10 bg-black/50 backdrop-blur-3xl sm:hidden"
  style="margin-bottom: env(safe-area-inset-bottom);"
>
  <div class="flex items-center justify-around p-2">
    <a
      use:link
      href="/"
      class={`group flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "text-white/40 hover:text-white"
      }`}
      aria-label="Home"
    >
      <Home size={20} />
    </a>

    <a
      use:link
      href="/search"
      class={`group flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "text-white/40 hover:text-white"
      }`}
      aria-label="Search"
    >
      <Search size={20} />
    </a>

    <a
      use:link
      href="/movies"
      class={`group flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "text-white/40 hover:text-white"
      }`}
      aria-label="Movies"
    >
      <Film size={20} />
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`group flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "text-white/40 hover:text-white"
      }`}
      aria-label="TV Shows"
    >
      <Tv size={20} />
    </a>

    <a
      use:link
      href="/watchlist"
      class={`group flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "text-white/40 hover:text-white"
      }`}
      aria-label="Watchlist"
    >
      <Heart size={20} />
    </a>
  </div>
</nav>
