<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { supabase, isSupabaseEnabled } from "../lib/supabaseClient";
  import { playerServers, loadServers, type PlayerServer } from "../stores/servers";
  import { ArrowLeft, Plus, Edit2, Trash2, Check, X, Server, GripVertical, AlertCircle, RefreshCw } from "lucide-svelte";

  let isAdmin = false;
  let validating = true;

  let isModalOpen = false;
  let editingServer: Partial<PlayerServer> | null = null;
  
  let isSaving = false;
  let isDeleting = false;

  $: servers = $playerServers;

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

    // Check if admin
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error || data !== true) {
        validating = false;
        return; // stays false, shows access denied
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
    isModalOpen = true;
  };

  const openEditModal = (s: PlayerServer) => {
    editingServer = { ...s };
    isModalOpen = true;
  };

  const closeModal = () => {
    isModalOpen = false;
    editingServer = null;
  };

  const saveServer = async () => {
    if (!editingServer?.name || !editingServer?.movie_url_pattern) {
      alert("Name and Movie URL pattern are required");
      return;
    }
    
    isSaving = true;
    try {
      if (editingServer.id) {
        // Update
        const { error } = await supabase
          .from("streaming_servers")
          .update({
            name: editingServer.name,
            movie_url_pattern: editingServer.movie_url_pattern,
            tv_url_pattern: editingServer.tv_url_pattern,
            is_active: editingServer.is_active,
            order_index: editingServer.order_index
          })
          .eq("id", editingServer.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("streaming_servers")
          .insert([{
            name: editingServer.name,
            movie_url_pattern: editingServer.movie_url_pattern,
            tv_url_pattern: editingServer.tv_url_pattern,
            is_active: editingServer.is_active,
            order_index: editingServer.order_index
          }]);
        if (error) throw error;
      }
      await loadServers();
      closeModal();
    } catch (err: any) {
      alert("Error saving: " + err.message);
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

  // Basic Move Up/Down
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
    
    // Optimistic UI update
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
      await loadServers(); // re-sync
    } catch (err: any) {
      alert("Failed to reorder: " + err.message);
      await loadServers(); // rollback
    }
  };

</script>

<div class="max-w-[1200px] mx-auto min-h-[60vh] space-y-8 animate-in fade-in duration-500">
  
  <!-- Header -->
  <div class="flex items-center gap-4 border-b border-white/5 pb-6">
    <button 
      on:click={goBack}
      class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 active:scale-95 shadow-xl shadow-black/50"
      aria-label="Go back"
    >
      <ArrowLeft size={20} class="text-white/80" />
    </button>
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-br from-white to-white/50 bg-clip-text text-transparent">
        Stream Settings
      </h1>
      <p class="text-white/40 text-sm mt-1 font-medium flex items-center gap-2">
        <Server size={14} class="text-yellow-400" /> Server Management Dashboard
      </p>
    </div>
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
      <p class="text-white/60 max-w-sm font-medium">You do not have administrative privileges to view or modify server configurations.</p>
    </div>
  {:else}
    <!-- Admin Content -->
    <div class="bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-3xl">
      
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 bg-white/2">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-500 ring-1 ring-yellow-400/20">
            <Server size={20} />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">Active APIs</h2>
            <p class="text-xs text-white/40">{servers.length} configured servers</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            on:click={loadServers}
            class="flex items-center justify-center h-11 w-11 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all ring-1 ring-white/10 active:scale-95 shrink-0"
            title="Reload servers"
          >
            <RefreshCw size={18} />
          </button>
          <button
            on:click={openNewModal}
            class="group relative flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-2xl bg-linear-to-b from-yellow-400 to-yellow-500 px-6 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(250,204,21,0.4)]"
          >
            <Plus size={18} class="transition-transform group-hover:rotate-90" />
            Add Server
          </button>
        </div>
      </div>

      <!-- Table Section -->
      <div class="overflow-x-auto border-t border-white/5">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-white/2 text-xs uppercase text-white/30 font-semibold tracking-wider">
            <tr>
              <th scope="col" class="px-6 py-4 w-12 text-center">Ord</th>
              <th scope="col" class="px-6 py-4">Status</th>
              <th scope="col" class="px-6 py-4 font-bold text-white/70">Server Name</th>
              <th scope="col" class="px-6 py-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            {#each servers as s, idx (s.id)}
              <tr class="group hover:bg-white/2 transition-colors">
                
                <!-- Reorder -->
                <td class="px-6 py-4 font-mono text-white/30 text-center">
                  <div class="flex flex-col items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button class="hover:text-white disabled:opacity-30 disabled:hover:text-white/30 transition-transform hover:-translate-y-0.5" disabled={idx === 0} on:click={() => moveUp(idx)}>▲</button>
                    <span class="text-[10px] leading-none select-none">{idx + 1}</span>
                    <button class="hover:text-white disabled:opacity-30 disabled:hover:text-white/30 transition-transform hover:translate-y-0.5" disabled={idx === servers.length - 1} on:click={() => moveDown(idx)}>▼</button>
                  </div>
                </td>
                
                <!-- Status Toggle -->
                <td class="px-6 py-4">
                  <button 
                    on:click={() => toggleActive(s)}
                    aria-label={`Toggle active status for ${s.name}`}
                    class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black ${s.is_active ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.is_active ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                </td>
                
                <!-- Name -->
                <td class="px-6 py-4 font-medium text-white/90">
                  <div class="flex items-center gap-3">
                    <div class={`h-2 w-2 rounded-full ${s.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                    {s.name}
                  </div>
                  <div class="text-[10px] text-white/30 font-mono mt-1 w-64 truncate" title={s.movie_url_pattern}>{s.movie_url_pattern}</div>
                </td>
                
                <!-- Actions -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                    <button 
                      on:click={() => openEditModal(s)}
                      class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      on:click={() => deleteServer(s.id)}
                      class="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete"
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="4" class="px-6 py-16 text-center text-white/30">
                  No servers found. Add one to start.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
{#if isModalOpen && editingServer}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
    <div class="w-full max-w-lg rounded-3xl bg-[#111] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden scale-in-center">
      
      <div class="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/2">
        <h3 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {#if editingServer.id}
            <Edit2 size={18} class="text-yellow-400" /> Edit Server
          {:else}
            <Plus size={18} class="text-yellow-400" /> New Server
          {/if}
        </h3>
        <button on:click={closeModal} class="text-white/40 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all bg-white/5 active:scale-95">
          <X size={20} />
        </button>
      </div>
      
      <div class="p-6 space-y-6">
        
        <div class="space-y-4">
          <div>
            <label for="server-name" class="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Server Name</label>
            <input 
              id="server-name"
              type="text" 
              bind:value={editingServer.name}
              placeholder="e.g. ⭐ VidLink - High Quality"
              class="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all" 
            />
          </div>
          
          <div>
            <label for="movie-url" class="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 flex justify-between">
              Movie URL Pattern 
              <span class="text-yellow-400/70 lowercase tracking-normal text-[10px] font-normal cursor-help" title="Use &#123;tmdbId&#125; and &#123;startAtParam&#125; as variables">Variables permitted</span>
            </label>
            <input 
              id="movie-url"
              type="text" 
              bind:value={editingServer.movie_url_pattern}
              placeholder="https://vidlink.pro/movie/&#123;tmdbId&#125;&#123;startAtParam&#125;"
              class="w-full font-mono rounded-2xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all" 
            />
          </div>

          <div>
            <label for="tv-url" class="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 flex justify-between">
              TV Show URL Pattern 
              <span class="text-yellow-400/70 lowercase tracking-normal text-[10px] font-normal cursor-help" title="Use &#123;tmdbId&#125;, &#123;season&#125;, &#123;episode&#125;, &#123;startAtParam&#125;">Variables permitted</span>
            </label>
            <input 
              id="tv-url"
              type="text" 
              bind:value={editingServer.tv_url_pattern}
              placeholder="https://vidlink.pro/tv/&#123;tmdbId&#125;/&#123;season&#125;/&#123;episode&#125;&#123;startAtParam&#125;"
              class="w-full font-mono rounded-2xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm text-white placeholder-white/20 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 focus:outline-none transition-all" 
            />
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button 
              on:click={() => { if (editingServer) editingServer.is_active = !editingServer.is_active; }}
              aria-label="Toggle active status"
              class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black ${editingServer.is_active ? 'bg-green-500' : 'bg-zinc-700'}`}
            >
              <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingServer.is_active ? 'translate-x-6' : 'translate-x-1'}`}></span>
            </button>
            <span class="text-sm font-medium text-white/80">Active</span>
          </div>
        </div>

      </div>

      <div class="border-t border-white/10 px-6 py-5 bg-white/1 flex items-center justify-end gap-3">
        <button 
          on:click={closeModal} 
          class="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button 
          on:click={saveServer} 
          disabled={isSaving}
          class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-br from-yellow-400 to-yellow-500 text-sm font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_5px_20px_-5px_rgba(250,204,21,0.5)]"
        >
          {#if isSaving}
            <div class="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
            Saving...
          {:else}
            <Check size={16} />
            Save Server
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
