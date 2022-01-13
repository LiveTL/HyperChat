<script lang="ts">
  export let runs: Ytc.ParsedRun[];
  export let forceDark = false;
  export let deleted = false;

  let deletedClass = '';

  $: if (deleted && forceDark) {
    deletedClass = 'text-deleted-dark italic';
  } else if (deleted) {
    deletedClass = 'text-deleted-light dark:text-deleted-dark italic';
  } else if (!deleted) {
    deletedClass = '';
  }
</script>

<span class="align-middle {$$props.class ?? ''}">
  {#each runs as run}
    {#if run.type === 'text'}
      <span
        on:click|stopPropagation
        class="cursor-auto align-middle {deletedClass}"
      >
        {run.text}
      </span>
    {:else if run.type === 'link'}
        <a
          class="inline underline align-middle"
          href={run.url}
          target="_blank"
          on:click|stopPropagation
        >
          {run.text}
        </a>
    {:else if run.type === 'emoji' && run.standardEmoji}
      <span
        on:click|stopPropagation
        class="cursor-auto align-middle text-base"
      >
        {run.alt}
      </span>
    {:else if run.type === 'emoji' && run.src}
      <img
        on:click|stopPropagation
        class="h-5 w-5 inline mx-0.5 align-middle"
        src={run.src}
        alt={run.alt}
      />
    {/if}
  {/each}
</span>
