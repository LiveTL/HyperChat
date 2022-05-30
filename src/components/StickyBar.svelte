<script lang="ts">
  import { isDark, stickySuperchats, currentProgress } from '../ts/storage';
  import PaidMessage from './PaidMessage.svelte';
  let scrollableElem: HTMLDivElement;
  $: if (scrollableElem) {
    scrollableElem.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollableElem.scrollBy(e.deltaY, 0);
    });
  }
  $: $stickySuperchats = $stickySuperchats.filter(sc => {
    return sc.start <= $currentProgress && sc.end >= $currentProgress;
  }).map(sc => {
    return {
      ...sc,
      progress: (sc.end - $currentProgress) / (sc.end - sc.start)
    };
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
          <PaidMessage message={sc.parsedMessage} chip fillPortion={sc.progress} />
        </span>
      {/each}
    </div>
  </div>
{/if}
