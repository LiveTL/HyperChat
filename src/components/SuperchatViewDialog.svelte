<script lang="ts">
  import {
    focusedSuperchat
  } from '../ts/storage';
  import TransparentDialog from './common/TransparentDialog.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import MembershipItem from './MembershipItem.svelte';

  $: sc = $focusedSuperchat as Ytc.ParsedTimedItem;
  let open = false;
  const openDialog = () => (open = true);
  const closeDialog = () => ($focusedSuperchat = null);
  $: if (sc) openDialog();
  $: if (!open) closeDialog();
</script>

<TransparentDialog bind:open>
  {#if ('superChat' in sc || 'superSticker' in sc)}
    <PaidMessage message={sc} />
  {:else}
    <MembershipItem message={sc} />
  {/if}
</TransparentDialog>
