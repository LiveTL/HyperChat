<script lang="ts">
  import { port } from '../ts/storage';
  import { toggleMembershipGifting } from '../ts/chat-actions';
  import { mdiCogOutline } from '@mdi/js';
  import {
    isYtFrame
  } from '../ts/chat-constants';
</script>

{#if isYtFrame}
  <div
    on:click={() => {
      toggleMembershipGifting($port);
    }}
    style="transform: translateX(3.5px);"
    class="rounded-full flex justify-center items-center cursor-pointer w-8 h-8">
      <svg viewBox="0 0 24 24" style="height: 20px;">
        <path d={mdiCogOutline} fill="white" />
      </svg>
  </div>
{/if}
