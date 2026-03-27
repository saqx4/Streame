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
  import Admin from "./pages/Admin.svelte";
  import NotFound from "./pages/NotFound.svelte";
  import { onMount } from "svelte";
  import { loadServers } from "./stores/servers";

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
    "/admin": Admin,
    "*": NotFound,
  };

  onMount(() => {
    loadServers();
  });

  // Scroll to top on every route change
  const handleRouteChange = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
  };
</script>

<div
  class="min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-black"
>
  <Sidebar />
  <main class="pb-24 pt-4 sm:ml-[72px] sm:pb-8 sm:pt-6">
    <div class="mx-auto w-full animate-in">
      <Router {routes} on:routeLoaded={handleRouteChange} />
    </div>
  </main>
</div>
