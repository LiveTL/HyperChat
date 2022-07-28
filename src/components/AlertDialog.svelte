<script lang="ts">
  import {
    alertDialog
  } from '../ts/storage';
  import Dialog from './common/Dialog.svelte';
  import Button from 'smelte/src/components/Button';
</script>
<Dialog active={Boolean($alertDialog)} noCloseButton class="z-50">
  <svelte:fragment slot="title">{$alertDialog?.title}</svelte:fragment>
  <div>
    {$alertDialog?.message}
  </div>
  <div slot="actions">
    <Button on:click={() => {
      $alertDialog = null;
    }} color="primary">OK</Button>
  </div>
</Dialog>
