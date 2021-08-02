<script lang="ts">
  export let message: Chat.Message;
  export let deleted: boolean | undefined;

  const member = message.author.types.some((type) => type === 'member');
  const moderator = message.author.types.some((type) => type === 'moderator');
  const owner = message.author.types.some((type) => type === 'owner');

  // TODO: superchat
</script>

<div class="p-1 break-words overflow-hidden " class:my-4={message.superchat}>
  {#if message.superchat}
    <strong class="mr-1 underline">{message.superchat.amount}</strong>
  {/if}
  <strong
    class="mr-2"
    class:text-member="{member}"
    class:dark:text-member-dark="{member}"
    class:text-moderator="{moderator}"
    class:dark:text-moderator-dark="{moderator}"
    class:text-owner="{owner}"
    class:dark:text-owner-dark="{owner}"
  >
    {message.author.name}
  </strong>
  {#each message.message as run}
    {#if run.type === 'text'}
      <span 
        class="inline"
        class:text-deleted="{deleted}"
        class:dark:text-deleted-dark="{deleted}"
      >
        {run.text}
      </span>
    {:else if run.type === 'link'}
      <span>
        <a class="inline" href={run.url} target="_blank">{run.text}</a>
      </span>
    {:else if run.type === 'emote' && run.src}
      <span>
        <img class="h-5 w-5 mx-px inline" src={run.src} alt="emote" />
      </span>
    {/if}
  {/each}
</div>
