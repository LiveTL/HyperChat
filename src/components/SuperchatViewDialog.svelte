<script lang="ts">
  import {
    focusedSuperchat
  } from '../ts/storage';
  import Dialog from './common/Dialog.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import Button from 'smelte/src/components/Button';
  $: sc = $focusedSuperchat as Ytc.ParsedTimedItem;
</script>

<Dialog active={Boolean(sc)} noCloseButton>
  <PaidMessage message={sc}  />
  <div slot="actions">
    <Button on:click={() => {
      $focusedSuperchat = null;
    }} color="primary">Close</Button>
  </div>
</Dialog>