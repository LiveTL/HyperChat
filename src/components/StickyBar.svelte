<script lang="ts">
  import dark from 'smelte/src/dark';
  import { stickySuperchats, currentProgress } from '../ts/storage';
  import TimedItem from './TimedItem.svelte';
  import { onDestroy, onMount } from 'svelte';

  const isDark = dark();
  let scrollableElem: HTMLDivElement;
  $: if (scrollableElem) {
    scrollableElem.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollableElem.scrollBy(e.deltaY + e.deltaX, 0);
    });
  }

  let interval: number | undefined;

  onMount(() => {
    interval = window.setInterval(() => {
      $stickySuperchats = $stickySuperchats.filter(sc => {
        return $currentProgress === null || (
          (sc.showtime / 1000 - 5 <= $currentProgress) &&
          (sc.showtime / 1000 + sc.tickerDuration) >= $currentProgress
        );
      });
    }, 500);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  $: open = Boolean($stickySuperchats.length);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if open}
  <div
    class="w-full overflow-y-hidden overflow-x-scroll scroll-on-hover items-start flex-none"
    style="--scrollbar-bg-color: #{$isDark ? '202020' : 'ffffff'};"
    bind:this={scrollableElem}
  >
    <div
      class="flex items-center h-9 enlarge-on-ff"
      style="
        width: fit-content;
        min-width: 100%;
        background-color: var(--scrollbar-bg-color);
      "
    >
      {#each $stickySuperchats as sc (sc.messageId)}
        <span class="mx-0.5 h-8 mt-1">
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
  .scroll-on-hover::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .scroll-on-hover::-webkit-scrollbar-track {
    background: var(--scrollbar-bg-color);
  }
  .scroll-on-hover {
    scrollbar-color: #888 var(--scrollbar-bg-color);
  }
  @supports (-moz-appearance:none) {
    .enlarge-on-ff {
      height: 2.5rem;
      padding-top: 0.25rem;
    }
  }
</style>
