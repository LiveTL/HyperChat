<script lang="ts">
  export let optInPrompt: Ytc.OptInPrompt;
  import { port, membershipGiftingStatus } from '../ts/storage';
  import { fetchOrToggleMembershipGifting } from '../ts/chat-actions';
</script>
<div class="w-full flex justify-center cursor-pointer">
  <span class="rounded-full px-2 py-1 text-white" style="background-color: rgba(0, 0, 0, 0.2);" on:click={() => {
    if (optInPrompt) fetchOrToggleMembershipGifting(optInPrompt, $port, !$membershipGiftingStatus);
  }}>
    Opt into membership gift reception
  </span>
</div>
