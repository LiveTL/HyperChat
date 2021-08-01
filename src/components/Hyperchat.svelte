<script>
  import WelcomeMessage from './WelcomeMessage.svelte';
</script>

<div class="content px-2.5 overflow-y-scroll h-screen">
  <WelcomeMessage />
</div>

<style>
  .content {
    scrollbar-width: thin;
  }
  .content::-webkit-scrollbar {
    width: 4px;
  }
  .content::-webkit-scrollbar-track {
    background: transparent;
  }
  .content::-webkit-scrollbar-thumb {
    background: #888;
  }
  .content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>
