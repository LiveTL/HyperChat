<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import { mdiClose } from '@mdi/js';
  import Message from './Message.svelte';
  import SvgButton from './SvgButton.svelte';
  import Tooltip from './Tooltip.svelte';

  export let pinned: Ytc.ParsedPinned;

  let dismissed = false;
  let shorten = false;
  const classes = 'rounded inline-flex flex-col overflow-visible ' +
   'bg-primary-900 p-2 w-full cursor-pointer text-white z-10';

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
    <div class="font-bold tracking-wide text-gray-400">
      {#each pinned.item.header as run}
        {#if run.type === 'text'}
          <span class="align-middle">
            {run.text}
          </span>
        {/if}
      {/each}
      <div class="float-right">
        <Tooltip anchor="right">
          <div slot="activator">
            <SvgButton
              path={mdiClose}
              transparent
              color="white"
              padding="0"
              on:click={() => { dismissed = true; }}
            />
          </div>
          Dismiss
        </Tooltip>
      </div>
    </div>
    {#if !shorten && !dismissed}
      <div class="mt-1" transition:slide|local={{ duration: 300 }}>
        <Message message={pinned.item.contents} forceDark />
      </div>
    {/if}
  </div>
{/if}
