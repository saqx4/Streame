<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { playerServers, loadServers, type PlayerServer } from "../stores/servers";
  import { 
    ArrowLeft, Plus, Edit2, Trash2, Check, X, Server, AlertCircle, RefreshCw,
    Zap, Film, Tv, Search, Copy, Sparkles, ChevronDown, Info, ExternalLink
  } from "lucide-svelte";

  let isAdmin = false;
  let validating = true;
  let searchQuery = "";
  let showPresets = false;

  let isModalOpen = false;
  let editingServer: Partial<PlayerServer> | null = null;
  let formError: string | null = null;
  
  let isSaving = false;
  let isDeleting = false;
  let copiedId: string | null = null;

  $: servers = $playerServers;
  $: activeServers = servers.filter(s => s.is_active);
  $: inactiveServers = servers.filter(s => !s.is_active);
  $: filteredServers = searchQuery.trim() 
    ? servers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.movie_url_pattern.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : servers;

  // Server presets for quick setup
  const serverPresets = [
    {
      name: "⭐ VidLink (JW Player)",
      movie_url_pattern: "https://vidlink.pro/movie/{tmdbId}?player=jw&primaryColor=006fee&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false{startAtParam}",
      tv_url_pattern: "https://vidlink.pro/tv/{tmdbId}/{season}/{episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false{startAtParam}"
    },
    {
      name: "⭐ VidLink (Standard)",
      movie_url_pattern: "https://vidlink.pro/movie/{tmdbId}?primaryColor=006fee&autoplay=false{startAtParam}",
      tv_url_pattern: "https://vidlink.pro/tv/{tmdbId}/{season}/{episode}?primaryColor=f5a524&autoplay=false{startAtParam}"
    },
    {
      name: "Vidsrc.xyz",
      movie_url_pattern: "https://vidsrc.me/embed/movie?tmdb={tmdbId}",
      tv_url_pattern: "https://vidsrc.me/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}"
    },
    {
      name: "Vidsrc.in",
      movie_url_pattern: "https://vidsrc.in/embed/movie?tmdb={tmdbId}",
      tv_url_pattern: "https://vidsrc.in/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}"
    },
    {
      name: "2Embed",
      movie_url_pattern: "https://www.2embed.skin/embed/movie/{tmdbId}",
      tv_url_pattern: "https://www.2embed.skin/embed/tv/{tmdbId}/{season}/{episode}"
    },
    {
      name: "AutoEmbed",
      movie_url_pattern: "https://autoembed.cc/movie/tmdb/{tmdbId}{startAtParam}",
      tv_url_pattern: "https://autoembed.cc/tv/tmdb/{tmdbId}-{season}-{episode}{startAtParam}"
    }
  ];

  onMount(async () => {
    if (!isSupabaseEnabled) {
      alert("Supabase is not configured.");
      push("/");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      push("/login");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error || data !== true) {
        validating = false;
        return;
      }
      isAdmin = true;
      validating = false;
    } catch (err) {
      validating = false;
    }
  });

  const goBack = () => {
    window.history.back();
  };

  const openNewModal = () => {
    editingServer = {
      name: "",
      movie_url_pattern: "",
      tv_url_pattern: "",
      order_index: servers.length,
      is_active: true
    };
    formError = null;
    isModalOpen = true;
  };

  const applyPreset = (preset: typeof serverPresets[0]) => {
    if (editingServer) {
      editingServer = {
        ...editingServer,
        name: preset.name,
        movie_url_pattern: preset.movie_url_pattern,
        tv_url_pattern: preset.tv_url_pattern
      };
    }
    showPresets = false;
  };

  const openEditModal = (s: PlayerServer) => {
    editingServer = { ...s };
    formError = null;
    isModalOpen = true;
  };

  const closeModal = () => {
    isModalOpen = false;
    editingServer = null;
    formError = null;
    showPresets = false;
  };

  const validateForm = (): boolean => {
    if (!editingServer?.name?.trim()) {
      formError = "Server name is required";
      return false;
    }
    if (!editingServer?.movie_url_pattern?.trim()) {
      formError = "Movie URL pattern is required";
      return false;
    }
    if (!editingServer.movie_url_pattern.includes('{tmdbId}')) {
      formError = "Movie URL must contain {tmdbId} variable";
      return false;
    }
    if (editingServer.tv_url_pattern && !editingServer.tv_url_pattern.includes('{tmdbId}')) {
      formError = "TV URL must contain {tmdbId} variable";
      return false;
    }
    formError = null;
    return true;
  };

  const saveServer = async () => {
    if (!validateForm()) return;

    const s = editingServer;
    if (!s) return;
    
    isSaving = true;
    try {
      if (s.id) {
        const { error } = await supabase
          .from("streaming_servers")
          .update({
            name: s.name,
            movie_url_pattern: s.movie_url_pattern,
            tv_url_pattern: s.tv_url_pattern,
            is_active: s.is_active,
            order_index: s.order_index
          })
          .eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("streaming_servers")
          .insert([{
            name: s.name,
            movie_url_pattern: s.movie_url_pattern,
            tv_url_pattern: s.tv_url_pattern,
            is_active: s.is_active,
            order_index: s.order_index
          }]);
        if (error) throw error;
      }
      await loadServers();
      closeModal();
    } catch (err: any) {
      formError = err.message || "Failed to save server";
    } finally {
      isSaving = false;
    }
  };

  const toggleActive = async (s: PlayerServer) => {
    try {
      const { error } = await supabase
        .from("streaming_servers")
        .update({ is_active: !s.is_active })
        .eq("id", s.id);
      if (error) throw error;
      await loadServers();
    } catch (err: any) {
      alert("Error toggling: " + err.message);
    }
  };

  const deleteServer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this server?")) return;
    isDeleting = true;
    try {
      const { error } = await supabase
        .from("streaming_servers")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadServers();
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    } finally {
      isDeleting = false;
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    await swapOrder(servers[index], servers[index - 1]);
  };
  
  const moveDown = async (index: number) => {
    if (index === servers.length - 1) return;
    await swapOrder(servers[index], servers[index + 1]);
  };

  const swapOrder = async (s1: PlayerServer, s2: PlayerServer) => {
    const order1 = s1.order_index;
    const order2 = s2.order_index;
    
    const newList = [...servers];
    const i1 = newList.findIndex(x => x.id === s1.id);
    const i2 = newList.findIndex(x => x.id === s2.id);
    newList[i1].order_index = order2;
    newList[i2].order_index = order1;
    newList.sort((a,b) => a.order_index - b.order_index);
    $playerServers = newList;

    try {
      await Promise.all([
        supabase.from("streaming_servers").update({ order_index: order2 }).eq("id", s1.id),
        supabase.from("streaming_servers").update({ order_index: order1 }).eq("id", s2.id)
      ]);
      await loadServers();
    } catch (err: any) {
      alert("Failed to reorder: " + err.message);
      await loadServers();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      copiedId = id;
      setTimeout(() => { copiedId = null; }, 2000);
    } catch {
      // ignore
    }
  };

  const testServer = (server: PlayerServer) => {
    const testUrl = server.movie_url_pattern
      .replace('{tmdbId}', '550') // Fight Club as test
      .replace('{startAtParam}', '');
    window.open(testUrl, '_blank', 'noopener,noreferrer');
  };
</script>

<div class="max-w-[1400px] mx-auto min-h-[60vh] space-y-6 animate-in fade-in duration-500">
  
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
    <div class="flex items-center gap-4">
      <button 
        on:click={goBack}
        class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 active:scale-95 shadow-xl shadow-black/50"
        aria-label="Go back"
      >
        <ArrowLeft size={20} class="text-white/80" />
      </button>
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-linear-to-br from-white to-white/50 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p class="text-white/40 text-sm mt-1 font-medium flex items-center gap-2">
          <Server size={14} class="text-yellow-400" /> Streaming Server Management
        </p>
      </div>
    </div>
    
    {#if isAdmin}
      <button
        on:click={loadServers}
        class="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all ring-1 ring-white/10 active:scale-95"
        title="Refresh"
      >
        <RefreshCw size={16} />
        <span class="hidden sm:inline text-sm font-medium">Refresh</span>
      </button>
    {/if}
  </div>

  {#if validating}
    <div class="flex flex-col items-center justify-center py-32 opacity-50">
      <div class="h-12 w-12 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin mb-4"></div>
      <p class="font-medium text-white/50">Verifying permissions...</p>
    </div>
  {:else if !isAdmin}
    <div class="flex flex-col items-center justify-center py-20 rounded-3xl border border-red-500/20 bg-red-500/5 text-center shadow-2xl backdrop-blur-3xl">
      <div class="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        <AlertCircle size={32} />
      </div>
      <h3 class="text-2xl font-bold text-white mb-2">Access Denied</h3>
      <p class="text-white/60 max-w-sm font-medium">You do not have administrative privileges to view this page.</p>
    </div>
  {:else}
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
            <Server size={20} />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{servers.length}</p>
            <p class="text-xs text-white/40 font-medium">Total Servers</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-400/10 text-green-400">
            <Zap size={20} />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{activeServers.length}</p>
            <p class="text-xs text-white/40 font-medium">Active</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-400">
            <Film size={20} />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{servers.filter(s => s.movie_url_pattern).length}</p>
            <p class="text-xs text-white/40 font-medium">Movie Support</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
            <Tv size={20} />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{servers.filter(s => s.tv_url_pattern).length}</p>
            <p class="text-xs text-white/40 font-medium">TV Support</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Management Panel -->
    <div class="bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
      
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 gap-4 bg-white/[0.02] border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="relative flex-1 sm:flex-none">
            <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text"
              bind:value={searchQuery}
              placeholder="Search servers..."
              class="w-full sm:w-64 h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-black/30 text-sm text-white placeholder-white/30 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all"
            />
          </div>
        </div>
        
        <button
          on:click={openNewModal}
          class="group flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-black transition-all hover:bg-yellow-300 active:scale-95 shadow-lg shadow-yellow-400/20"
        >
          <Plus size={18} class="transition-transform group-hover:rotate-90" />
          Add Server
        </button>
      </div>

      <!-- Server Cards Grid -->
      <div class="p-4 sm:p-6">
        {#if filteredServers.length === 0}
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
              <Server size={28} />
            </div>
            <p class="text-white/50 font-medium mb-1">
              {searchQuery ? 'No servers match your search' : 'No servers configured'}
            </p>
            <p class="text-white/30 text-sm">
              {searchQuery ? 'Try a different search term' : 'Add your first streaming server to get started'}
            </p>
          </div>
        {:else}
          <div class="grid gap-3">
            {#each filteredServers as s, idx (s.id)}
              <div class="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                
                <!-- Left: Order + Status + Info -->
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <!-- Order Controls -->
                  <div class="flex flex-col items-center justify-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                    <button 
                      class="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:hover:text-white/50 transition-all"
                      disabled={idx === 0} 
                      on:click={() => moveUp(idx)}
                      title="Move up"
                    >
                      <ChevronDown size={14} class="rotate-180" />
                    </button>
                    <span class="text-[10px] font-mono text-white/50 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                    <button 
                      class="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:hover:text-white/50 transition-all"
                      disabled={idx === filteredServers.length - 1} 
                      on:click={() => moveDown(idx)}
                      title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  
                  <!-- Status Toggle -->
                  <button 
                    on:click={() => toggleActive(s)}
                    aria-label={`Toggle ${s.name}`}
                    class={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.is_active ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <span class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.is_active ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                  
                  <!-- Server Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <div class={`h-2 w-2 rounded-full shrink-0 ${s.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-500'}`}></div>
                      <h3 class="font-semibold text-white/90 truncate">{s.name}</h3>
                      {#if !s.tv_url_pattern}
                        <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400/80">Movies Only</span>
                      {/if}
                    </div>
                    <p class="text-xs text-white/30 font-mono mt-0.5 truncate" title={s.movie_url_pattern}>
                      {s.movie_url_pattern}
                    </p>
                  </div>
                </div>
                
                <!-- Right: Actions -->
                <div class="flex items-center gap-2 justify-end">
                  <button 
                    on:click={() => testServer(s)}
                    class="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    title="Test with sample movie"
                  >
                    <ExternalLink size={12} />
                    Test
                  </button>
                  <button 
                    on:click={() => copyToClipboard(s.movie_url_pattern, s.id)}
                    class="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    title="Copy URL pattern"
                  >
                    {#if copiedId === s.id}
                      <Check size={14} class="text-green-400" />
                    {:else}
                      <Copy size={14} />
                    {/if}
                  </button>
                  <button 
                    on:click={() => openEditModal(s)}
                    class="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    on:click={() => deleteServer(s.id)}
                    class="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-red-400/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                    title="Delete"
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
{#if isModalOpen && editingServer}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200" 
    role="button"
    tabindex="0"
    aria-label="Close dialog"
    on:click={closeModal}
    on:keydown={(e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Escape') closeModal();
    }}
  >
    <div 
      class="w-full max-w-xl rounded-3xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden" 
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation={() => {}}
    >
      
      <div class="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
        <h3 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          {#if editingServer.id}
            <Edit2 size={18} class="text-yellow-400" /> Edit Server
          {:else}
            <Plus size={18} class="text-yellow-400" /> Add New Server
          {/if}
        </h3>
        <button on:click={closeModal} class="h-9 w-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>
      
      <!-- Presets Section (only for new servers) -->
      {#if !editingServer.id}
        <div class="px-6 pt-5">
          <div class="relative">
            <button 
              on:click={() => showPresets = !showPresets}
              class="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition-all"
            >
              <span class="flex items-center gap-2">
                <Sparkles size={16} class="text-yellow-400" />
                Quick Setup from Preset
              </span>
              <ChevronDown size={16} class="transition-transform {showPresets ? 'rotate-180' : ''}" />
            </button>
            
            {#if showPresets}
              <div class="absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl overflow-hidden">
                <div class="max-h-[240px] overflow-auto p-2">
                  {#each serverPresets as preset}
                    <button 
                      on:click={() => applyPreset(preset)}
                      class="w-full flex flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 transition-all"
                    >
                      <span class="text-sm font-medium text-white/90">{preset.name}</span>
                      <span class="text-[10px] text-white/30 font-mono truncate w-full">{preset.movie_url_pattern}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Form -->
      <div class="p-6 space-y-5">
        {#if formError}
          <div class="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} class="shrink-0" />
            {formError}
          </div>
        {/if}
        
        <div>
          <label for="server-name" class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            <span>Server Name</span>
            <span class="text-white/20 lowercase font-normal tracking-normal">Display name for users</span>
          </label>
          <input 
            id="server-name"
            type="text" 
            bind:value={editingServer.name}
            placeholder="e.g. ⭐ VidLink - High Quality"
            class="w-full h-11 rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all" 
          />
        </div>
        
        <div>
          <label for="movie-url" class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            <span class="flex items-center gap-1.5">
              Movie URL
              <Film size={12} class="text-blue-400" />
            </span>
            <span class="text-white/20 lowercase font-normal tracking-normal">Required</span>
          </label>
          <input 
            id="movie-url"
            type="text" 
            bind:value={editingServer.movie_url_pattern}
            placeholder="https://example.com/movie/&#123;tmdbId&#125;&#123;startAtParam&#125;"
            class="w-full h-11 rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all font-mono" 
          />
          <p class="mt-1.5 text-[10px] text-white/30 flex items-center gap-1">
            <Info size={10} />
            Use <code class="text-yellow-400/70 bg-yellow-400/10 px-1 rounded">{'{tmdbId}'}</code> and <code class="text-yellow-400/70 bg-yellow-400/10 px-1 rounded">{'{startAtParam}'}</code> as placeholders
          </p>
        </div>

        <div>
          <label for="tv-url" class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            <span class="flex items-center gap-1.5">
              TV Show URL
              <Tv size={12} class="text-purple-400" />
            </span>
            <span class="text-white/20 lowercase font-normal tracking-normal">Optional</span>
          </label>
          <input 
            id="tv-url"
            type="text" 
            bind:value={editingServer.tv_url_pattern}
            placeholder="https://example.com/tv/&#123;tmdbId&#125;/&#123;season&#125;/&#123;episode&#125;"
            class="w-full h-11 rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all font-mono" 
          />
          <p class="mt-1.5 text-[10px] text-white/30 flex items-center gap-1">
            <Info size={10} />
            Also supports <code class="text-yellow-400/70 bg-yellow-400/10 px-1 rounded">{'{season}'}</code> and <code class="text-yellow-400/70 bg-yellow-400/10 px-1 rounded">{'{episode}'}</code>
          </p>
        </div>

        <div class="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <div>
            <p class="text-sm font-medium text-white/80">Server Status</p>
            <p class="text-xs text-white/40">Active servers are shown to users</p>
          </div>
          <button 
            on:click={() => { if (editingServer) editingServer.is_active = !editingServer.is_active; }}
            aria-label="Toggle active status"
            class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingServer.is_active ? 'bg-green-500' : 'bg-zinc-700'}`}
          >
            <span class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editingServer.is_active ? 'translate-x-6' : 'translate-x-1'}`}></span>
          </button>
        </div>
      </div>

      <div class="border-t border-white/10 px-6 py-4 bg-white/[0.01] flex items-center justify-end gap-3">
        <button 
          on:click={closeModal} 
          class="h-10 px-5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button 
          on:click={saveServer} 
          disabled={isSaving}
          class="flex items-center gap-2 h-10 px-6 rounded-xl bg-yellow-400 text-sm font-bold text-black hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          {#if isSaving}
            <div class="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
            Saving...
          {:else}
            <Check size={16} />
            {editingServer.id ? 'Update Server' : 'Add Server'}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scale-in-center {
    animation: scale-in-center 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }
  @keyframes scale-in-center {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
</style>

