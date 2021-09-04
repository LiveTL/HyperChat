<script lang="ts">
  import Message from './Message.svelte';

  export let message: Ytc.ParsedMessage;

  const classes = 'p-2 inline-flex flex-col rounded break-words overflow-hidden w-full text-white';

  $: membership = message.membership;
  $: if (!membership) {
    console.error('Not a membership item', { message });
  }
</script>

{#if membership}
  <div class={classes} style="background-color: #0f9d58;">
    <span class="font-bold tracking-wide">
      {message.author.name}
    </span>
    <Message message={message} hideName />
  </div>
{/if}
