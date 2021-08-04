<script lang="ts">
  import { slide } from 'svelte/transition';
  import { Card } from 'smelte';
  import Message from './Message.svelte';

  export let pinned: Ytc.ParsedPinned;

  let hidden = false;
  const classes = 'rounded inline-flex flex-col overflow-hidden bg-primary-200 dark:bg-primary-900 p-2 w-full cursor-pointer';
</script>

<div on:click={() => { hidden = !hidden; }}>
  <Card.Card classes={classes}>
    <div slot="title" class="py-1 font-bold tracking-wide italic">
      {#each pinned.item.header as run}
        {#if run.type === 'text'}
          <span>
            {run.text}
          </span>
        {/if}
      {/each}
    </div>
    <div slot="text">
      {#if !hidden}
        <div transition:slide="{{ duration: 300 }}">
          <Message message={pinned.item.contents} />
        </div>
      {/if}
    </div>
  </Card.Card>
</div>
