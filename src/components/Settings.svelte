<script lang="ts">
  import { onMount } from 'svelte';
  import Interface from './settings/InterfaceSettings.svelte';

  onMount(() => {
    document.body.classList.add('bg-gray-300');
  });
</script>

<svelte:head>
  <title>HyperChat Settings</title>
</svelte:head>

<div class="text-base p-2" style="scrollbar-width: thin; scrollbar-color: #888 transparent;">
  <Interface />
</div>

<style>
  :global(::-webkit-scrollbar) {
    width: 4px;
    height: 4px;
  }
  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: #888;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: #555;
  }
</style>
