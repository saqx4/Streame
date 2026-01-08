<script lang="ts">
  import { link, location } from "svelte-spa-router";
  import { Home, Search, Film, Tv, Heart, Settings } from "lucide-svelte";

  const isActive = (p: string, current: string) => {
    if (p === "/") return current === "/";
    return current.startsWith(p);
  };
</script>

<aside
  class="fixed left-0 top-0 z-50 hidden h-screen w-[60px] border-r border-white/5 bg-black/70 backdrop-blur sm:block"
>
  <div class="flex h-full flex-col items-center gap-2 py-3">
    <a
      use:link
      href="/"
      class={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10 ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
      aria-label="Home"
    >
      <Home size={18} />
    </a>

    <a
      use:link
      href="/search"
      class={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 transition-all ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : ""
      }`}
      aria-label="Search"
    >
      <Search size={18} />
    </a>

    <a
      use:link
      href="/movies"
      class={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 transition-all ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : ""
      }`}
      aria-label="Movies"
    >
      <Film size={18} />
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 transition-all ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : ""
      }`}
      aria-label="TV Shows"
    >
      <Tv size={18} />
    </a>

    <a
      use:link
      href="/watchlist"
      class={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 transition-all ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : ""
      }`}
      aria-label="Watchlist"
    >
      <Heart size={18} />
    </a>

    <div class="flex-1"></div>

    <a
      use:link
      href="/settings"
      class={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 transition-all ${
        isActive("/settings", $location)
          ? "bg-yellow-400 text-black ring-yellow-400"
          : ""
      }`}
      aria-label="Settings"
    >
      <Settings size={18} />
    </a>
  </div>
</aside>

<nav
  class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/70 backdrop-blur sm:hidden"
  style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);"
>
  <div class="mx-auto grid max-w-[1400px] grid-cols-6 gap-2 px-3 pt-2">
    <a
      use:link
      href="/"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="Home"
    >
      <Home size={18} />
      <span class="mt-1">Home</span>
    </a>

    <a
      use:link
      href="/search"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/search", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="Search"
    >
      <Search size={18} />
      <span class="mt-1">Search</span>
    </a>

    <a
      use:link
      href="/movies"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/movies", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="Movies"
    >
      <Film size={18} />
      <span class="mt-1">Movies</span>
    </a>

    <a
      use:link
      href="/tv-shows"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/tv-shows", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="TV Shows"
    >
      <Tv size={18} />
      <span class="mt-1">TV</span>
    </a>

    <a
      use:link
      href="/watchlist"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/watchlist", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="Watchlist"
    >
      <Heart size={18} />
      <span class="mt-1">List</span>
    </a>

    <a
      use:link
      href="/settings"
      class={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium transition-all ${
        isActive("/settings", $location)
          ? "bg-yellow-400 text-black shadow-lg"
          : "text-white/60 hover:bg-white/5"
      }`}
      aria-label="Settings"
    >
      <Settings size={18} />
      <span class="mt-1">Settings</span>
    </a>
  </div>
</nav>
