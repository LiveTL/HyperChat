<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import { mdiClose } from '@mdi/js';
  import Message from './Message.svelte';
  import SvgButton from './SvgButton.svelte';

  export let pinned: Ytc.ParsedPinned;

  let dismissed = false;
  let shorten = false;
  const classes = 'rounded inline-flex flex-col overflow-hidden ' +
   'bg-primary-900 p-1.5 w-full cursor-pointer text-white';

  const onShorten = () => { shorten = !shorten; };

  $: if (pinned) {
    dismissed = false;
    shorten = false;
  }
</script>

{#if !dismissed}
  <div
    class={classes}
    on:click={onShorten}
    transition:fade={{ duration: 250 }}
  >
    <div class="py-1 font-bold tracking-wide text-gray-400">
      {#each pinned.item.header as run}
        {#if run.type === 'text'}
          <span>
            {run.text}
          </span>
        {/if}
      {/each}
      <SvgButton
        path={mdiClose}
        transparent
        color="white"
        padding="0"
        add="float-right"
        on:click={() => { dismissed = true; }}
      />
    </div>
    {#if !shorten && !dismissed}
      <div transition:slide|local="{{ duration: 300 }}">
        <Message message={pinned.item.contents} forceDark />
      </div>
    {/if}
  </div>
{/if}
