<script lang="ts">
  import type { Theme } from '../ts/chat-constants';

  import TranslatedMessage from './TranslatedMessage.svelte';

  export let runs: Ytc.ParsedRun[];
  export let forceDark = false;
  export let deleted = false;
  export let forceTLColor: Theme;

  let deletedClass = '';

  $: if (deleted && forceDark) {
    deletedClass = 'text-deleted-dark italic';
  } else if (deleted) {
    deletedClass = 'text-deleted-light dark:text-deleted-dark italic';
  } else if (!deleted) {
    deletedClass = '';
  }
</script>

<span
  on:click|stopPropagation
  class="cursor-auto align-middle {deletedClass} {$$props.class ?? ''}"
  style="word-break: break-word"
>
  {#each runs as run}
    {#if run.type === 'text'}
      {#if deleted}
        <span>{run.text}</span>
      {:else}
        <TranslatedMessage text={run.text} {forceTLColor} />
      {/if}
    {:else if run.type === 'link'}
      <a
        class="inline underline align-middle"
        href={run.url}
        target="_blank"
      >
        {run.text}
      </a>
    {:else if run.type === 'emoji' && run.standardEmoji}
      <span
        class="cursor-auto align-middle text-base"
      >
        {run.alt}
      </span>
    {:else if run.type === 'emoji' && run.src}
      <img
        class="h-5 w-5 inline mx-0.5 align-middle"
        src={run.src}
        alt={run.alt}
      />
    {/if}
  {/each}
</span>
