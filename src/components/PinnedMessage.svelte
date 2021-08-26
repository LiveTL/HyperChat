<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import Message from './Message.svelte';
  import Tooltip from './common/Tooltip.svelte';
  import Icon from 'smelte/src/components/Icon';

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
      <div class="font-medium tracking-wide text-white flex-1">
        {#each pinned.item.header as run}
          {#if run.type === 'text'}
            <span class="align-middle">{run.text}</span>
          {/if}
        {/each}
      </div>
      <div class="flex-none self-end">
        <Tooltip offsetY={0} small>
          <Icon
            slot="activator"
            class="cursor-pointer text-lg"
            on:click={() => { dismissed = true; }}
          >
            close
          </Icon>
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
