<script lang="ts">
  import Message from './Message.svelte';
  import MessageRun from './MessageRuns.svelte';
  import { focusedSuperchat, showProfileIcons } from '../ts/storage';

  export let message: Ytc.ParsedTimedItem;
  export let chip = false;
  export let detailText: string = '';
  export let fillPortion = 1;

  const classes = `inline-flex flex-col rounded overflow-hidden text-white ${chip ? 'w-fit whitespace-nowrap' : 'w-full break-words'}`;

  $: membership = message.membership;
  $: if (!membership) {
    console.error('Not a membership item', { message });
  }
  $: isMilestoneChat = message.message.length > 0;
</script>

{#if membership}
  <div class={classes}>
    <div
      class="relative overflow-hidden {chip ? 'rounded-full cursor-pointer w-max p-1.5' : 'p-2'}"
      style={chip ? (`background-color: #${isMilestoneChat ? '107516' : '0f9d58'};`) : ''}
      on:click={() => {
        if (chip) $focusedSuperchat = message;
      }}
    >
      {#if $showProfileIcons}
        <img
          class="h-5 w-5 inline align-middle rounded-full flex-none"
          src={message.author.profileIcon.src}
          alt={message.author.profileIcon.alt}
        />
      {/if}
      {#if chip}
        <div class="absolute top-0 right-0 h-full" style="
          background-color: rgba(0, 0, 0, 0.1);
          width: {Math.round(fillPortion * 100)}%;
        " />
      {/if}
      {#if !chip}
        <span class="font-bold tracking-wide align-middle {chip ? '' : 'mr-3'}">
          {message.author.name}
        </span>
      {/if}
      {#if !chip}
        {#if membership.headerPrimaryText.length > 0}
          <MessageRun
            class="font-medium mr-3"
            runs={membership.headerPrimaryText}
          />
        {/if}
        <MessageRun runs={membership.headerSubtext} />
      {/if}
      {#if detailText}
        <span class="font-bold">{detailText}</span>
      {/if}
    </div>
    {#if !chip && isMilestoneChat}
      <div class="p-2">
        <Message message={message} hideName />
      </div>
    {/if}
  </div>
{/if}
