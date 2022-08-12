<script lang="ts">
  import Dialog from './Dialog.svelte';
  export let open = false;
</script>

<Dialog bind:active={open} noCloseButton class="no-padding">
  <slot />
</Dialog>

<style>
  :global(.no-padding>div):nth-child(1), :global(.no-padding>div):nth-child(3) {
    display: none;
  }
  :global(.no-padding) {
    padding: 0px !important;
    margin: 1rem !important;
    background-color: transparent !important;
  }
</style>
