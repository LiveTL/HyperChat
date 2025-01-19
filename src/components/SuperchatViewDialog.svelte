<script lang="ts">
  import { focusedSuperchat } from '../ts/storage';
  import Dialog from './common/Dialog.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import MembershipItem from './MembershipItem.svelte';

  $: sc = $focusedSuperchat!;
  let open = false;
  const openDialog = () => (open = true);
  const closeDialog = () => ($focusedSuperchat = null);
  $: if (sc) openDialog();
  $: if (!open) closeDialog();
</script>

<Dialog bind:active={open} noCloseButton class="no-padding">
  {#if ('superChat' in sc || 'superSticker' in sc)}
    <PaidMessage message={sc} />
  {:else}
    <MembershipItem message={sc} />
  {/if}
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
