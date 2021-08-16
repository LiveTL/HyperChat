<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import { mdiClose } from '@mdi/js';
  import Message from './Message.svelte';
  import SvgButton from './common/SvgButton.svelte';
  import Tooltip from './common/Tooltip.svelte';

  export let pinned: Ytc.ParsedPinned;

  let dismissed = false;
  let shorten = false;
  const classes = 'rounded inline-flex flex-col overflow-visible ' +
   'bg-primary-900 p-2 w-full cursor-pointer text-white z-10 shadow';

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
    <div class="flex flex-row items-center">
      <div class="font-medium tracking-wide text-white">
        {#each pinned.item.header as run}
          {#if run.type === 'text'}
            <span class="align-middle">{run.text}</span>
          {/if}
        {/each}
      </div>
      <div class="flex-grow">
        <div class="float-right">
          <Tooltip
            anchor="right"
            textColor="white"
            bgColor="gray-800"
            yPadding="1"
          >
            <SvgButton
              slot="activator"
              path={mdiClose}
              transparent
              color="white"
              xPadding="0"
              yPadding="0"
              on:click={() => { dismissed = true; }}
            />
            Dismiss
          </Tooltip>
        </div>
      </div>
    </div>
    {#if !shorten && !dismissed}
      <div class="mt-1" transition:slide|local={{ duration: 300 }}>
        <Message message={pinned.item.contents} forceDark />
      </div>
    {/if}
  </div>
{/if}
