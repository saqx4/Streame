<script lang="ts">
  import Router from "svelte-spa-router";
  import Sidebar from "./components/Sidebar.svelte";
  import Home from "./pages/Home.svelte";
  import Movies from "./pages/Movies.svelte";
  import MovieDetail from "./pages/MovieDetail.svelte";
  import TVShows from "./pages/TVShows.svelte";
  import TVDetail from "./pages/TVDetail.svelte";
  import Watch from "./pages/Watch.svelte";
  import Search from "./pages/Search.svelte";
  import Watchlist from "./pages/Watchlist.svelte";
  import Settings from "./pages/Settings.svelte";
  import Login from "./pages/Login.svelte";
  import NotFound from "./pages/NotFound.svelte";

  const routes = {
    "/": Home,
    "/search": Search,
    "/movies": Movies,
    "/movie/:id": MovieDetail,
    "/tv-shows": TVShows,
    "/tv/:id": TVDetail,
    // Watch routes - more specific first
    "/watch/tv/:id/:season/:episode/:startAt": Watch,
    "/watch/tv/:id/:season/:episode": Watch,
    "/watch/:type/:id/:startAt": Watch,
    "/watch/:type/:id": Watch,
    "/watchlist": Watchlist,
    "/settings": Settings,
    "/login": Login,
    "*": NotFound,
  };
</script>

<div
  class="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black"
>
  <Sidebar />
  <main class="px-5 pb-28 pt-5 sm:ml-[60px] sm:px-7 sm:pb-20 sm:pt-7">
    <div class="mx-auto w-full max-w-[1400px]">
      <Router {routes} />
    </div>
  </main>
</div>
