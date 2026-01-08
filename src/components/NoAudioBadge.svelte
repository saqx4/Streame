<script lang="ts">
  import { onMount } from 'svelte'
  import { X } from 'lucide-svelte'

  let dismissed = false

  onMount(() => {
    try {
      dismissed = localStorage.getItem('streame_no_audio_dismissed') === '1'
    } catch {
      dismissed = false
    }
  })

  const close = () => {
    dismissed = true
    try {
      localStorage.setItem('streame_no_audio_dismissed', '1')
    } catch {}
  }
</script>

{#if !dismissed}
  <button
    class="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs text-white/80 ring-1 ring-white/15 backdrop-blur hover:bg-black/80 sm:bottom-4"
    on:click={close}
  >
    <span class="text-white/60">x</span>
    <span>No Audio</span>
    <X size={14} class="text-white/60" />
  </button>
{/if}
