<script lang="ts">
  import Message from './Message.svelte';
  import MessageRun from './MessageRuns.svelte';

  export let message: Ytc.ParsedMessage;

  const classes = 'inline-flex flex-col rounded break-words overflow-hidden w-full text-white';

  $: membership = message.membership;
  $: if (!membership) {
    console.error('Not a membership item', { message });
  }
  $: isMilestoneChat = message.message.length > 0;
</script>

{#if membership}
  <div class={classes} style="background-color: #0f9d58;">
    <div
      class="p-2"
      style="{isMilestoneChat ? 'background-color: #107516;' : ''}"
    >
      <span class="font-bold tracking-wide align-middle mr-3">
        {message.author.name}
      </span>
      {#if membership.headerPrimaryText.length > 0}
        <MessageRun
          class="font-medium mr-3"
          runs={membership.headerPrimaryText}
        />
      {/if}
      <MessageRun runs={membership.headerSubtext} />
    </div>
    {#if isMilestoneChat}
      <div class="p-2">
        <Message message={message} hideName />
      </div>
    {/if}
  </div>
{/if}
