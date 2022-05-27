<script lang="ts">
  import { isDark, stickySuperchats } from '../ts/storage';
  import PaidMessage from './PaidMessage.svelte';
  let scrollableElem: HTMLDivElement;
  $: if (scrollableElem) {
    scrollableElem.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollableElem.scrollBy(e.deltaY, 0);
    });
  }
</script>

{#if $stickySuperchats.length}
  <div class="w-full overflow-y-hidden" style="overflow-x: overlay;" bind:this={scrollableElem}>
    <div
      class="flex ml-1 gap-1 items-center"
      style="
        height: calc(2.5rem + 4px);
        width: fit-content;
        min-width: 100%;
        background-color: #{$isDark ? '202020' : 'ffffff'}
      "
    >
      {#each $stickySuperchats as sc}
        {#if !sc.superSticker}
          <PaidMessage message={sc} chip />
        {/if}
      {/each}
    </div>
  </div>
{/if}
