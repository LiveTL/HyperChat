<script lang="ts">
  export let optInPrompt: Ytc.OptInPrompt;
  import { port, membershipGiftingEnabledOnChannel } from '../ts/storage';
  import { fetchOrToggleMembershipGifting } from '../ts/chat-actions';
  import { mdiInformation } from '@mdi/js';
  import Checkbox from './common/Checkbox.svelte';
  let checked = false;
  const update = () => {
    if ($membershipGiftingEnabledOnChannel !== null) {
      checked = $membershipGiftingEnabledOnChannel;
    }
  };
  $: $membershipGiftingEnabledOnChannel, update();
</script>
<div class="w-full flex justify-center  cursor-pointer" on:click={() => {
  if (optInPrompt) fetchOrToggleMembershipGifting(optInPrompt, $port, true);
}}>
  <span class="rounded-full px-2 py-1" style="background-color: rgba(0, 0, 0, 0.2);">
    <svg height="16" width="16" viewBox="0 0 24 24" class="inline-block">
      <path d={mdiInformation} fill="white"/>
    </svg>
    <Checkbox label="Opt into membership gift reception for this channel" bind:checked />
    <span class="text-white underline">
      Opt into membership gift reception for this channel
    </span>
  </span>
</div>
