<script lang="ts">
  import dark from 'smelte/src/dark';
  import { stickySuperchats, currentProgress } from '../ts/storage';
  import PaidMessage from './PaidMessage.svelte';

  const isDark = dark();
  let scrollableElem: HTMLDivElement;
  $: if (scrollableElem) {
    scrollableElem.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollableElem.scrollBy(e.deltaY, 0);
    });
  }
  $: $stickySuperchats = $stickySuperchats.filter(sc => {
    return $currentProgress === null ||
      ((sc.showtime / 1000 <= $currentProgress) && (sc.showtime / 1000 + sc.tickerDuration) >= $currentProgress);
  });
</script>

{#if $stickySuperchats.length}
  <div class="w-full overflow-y-hidden" style="overflow-x: overlay;" bind:this={scrollableElem}>
    <div
      class="flex items-center"
      style="
        height: calc(2.5rem + 4px);
        width: fit-content;
        min-width: 100%;
        background-color: #{$isDark ? '202020' : 'ffffff'}
      "
    >
      {#each $stickySuperchats as sc}
        <span class="mx-0.5">
          <PaidMessage
            message={sc}
            chip
            fillPortion={Math.max(0, (($currentProgress || 0) - sc.showtime / 1000) / sc.tickerDuration)}
          />
        </span>
      {/each}
    </div>
  </div>
{/if}
