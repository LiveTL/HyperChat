<script lang="ts">
  import {
    focusedSuperchat
  } from '../ts/storage';
  import Dialog from './common/Dialog.svelte';
  import PaidMessage from './PaidMessage.svelte';
  $: sc = $focusedSuperchat as Ytc.ParsedTimedItem;
  let open = false;
  const openDialog = () => (open = true);
  const closeDialog = () => ($focusedSuperchat = null);
  $: if (sc) openDialog();
  $: if (!open) closeDialog();
</script>

<Dialog bind:active={open} noCloseButton>
  <PaidMessage message={sc}  />
</Dialog>
