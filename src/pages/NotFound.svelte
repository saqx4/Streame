<script lang="ts">
  import { link } from 'svelte-spa-router'
</script>

<div class="rounded-2xl border border-white/10 bg-white/5 p-6">
  <h1 class="text-xl font-semibold">Page not found</h1>
  <p class="mt-2 text-sm text-white/60">The page you are looking for doesn’t exist.</p>
  <a
    use:link
    href="/"
    class="mt-4 inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
  >
    Go home
  </a>
</div>
