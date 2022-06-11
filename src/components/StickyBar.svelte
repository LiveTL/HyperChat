<script lang="ts">
  import dark from 'smelte/src/dark';
  import { stickySuperchats, currentProgress } from '../ts/storage';
  import TimedItem from './TimedItem.svelte';

  const isDark = dark();
  let scrollableElem: HTMLDivElement;
  $: if (scrollableElem) {
    scrollableElem.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollableElem.scrollBy(e.deltaY + e.deltaX, 0);
    });
  }
  $: $stickySuperchats = $stickySuperchats.filter(sc => {
    return $currentProgress === null ||
      ((sc.showtime / 1000 - 5 <= $currentProgress) && (sc.showtime / 1000 + sc.tickerDuration) >= $currentProgress);
  });
</script>

{#if $stickySuperchats.length}
  <div class="w-full overflow-y-hidden scroll-on-hover" bind:this={scrollableElem}>
    <div
      class="flex items-center"
      style="
        height: 40px;
        width: fit-content;
        min-width: 100%;
        background-color: #{$isDark ? '202020' : 'ffffff'}
      "
    >
      {#each $stickySuperchats as sc (sc.messageId)}
        <span class="mx-0.5">
          <TimedItem
            item={sc}
            chip
            fillPortion={Math.max(0, (($currentProgress || 0) - sc.showtime / 1000) / sc.tickerDuration)}
          />
        </span>
      {/each}
    </div>
  </div>
{/if}

<style>
  .scroll-on-hover {
    overflow-x: hidden;
  }
  .scroll-on-hover:hover {
    overflow-x: auto;
  }
</style>
