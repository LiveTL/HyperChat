<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import { Button } from 'smelte';
  import Message from './Message.svelte';

  export let pinned: Ytc.ParsedPinned;

  let dismissed = false;
  let shorten = false;
  const classes = 'rounded inline-flex flex-col overflow-hidden ' +
   'bg-primary-900 p-2 w-full cursor-pointer text-white';

  const onShorten = () => { shorten = !shorten; };

  $: if (pinned) {
    dismissed = false;
  }
</script>

{#if !dismissed}
  <div
    class={classes}
    on:click={onShorten}
    transition:fade={{ duration: 250 }}
  >
    <div class="py-1 font-bold tracking-wide italic">
      {#each pinned.item.header as run}
        {#if run.type === 'text'}
          <span>
            {run.text}
          </span>
        {/if}
      {/each}
      <Button
        icon="close"
        small
        text
        color="white"
        add="float-right"
        remove="p-4 px-4 pt-1 pb-1 pl-2 pr-2 h-8 w-8 hover:bg-white"
        on:click={() => { dismissed = true; }}
      />
    </div>
    {#if !shorten && !dismissed}
      <div transition:slide|local="{{ duration: 300 }}">
        <Message message={pinned.item.contents} forceDark={true} />
      </div>
    {/if}
  </div>
{/if}
