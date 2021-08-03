<script lang="ts">
  export let message: Chat.Message;

  const member = message.author.types.some((type) => type === 'member');
  const moderator = message.author.types.some((type) => type === 'moderator');
  const owner = message.author.types.some((type) => type === 'owner');

  $: memberClasses = member ? 'text-member dark:text-member-dark' : '';
  $: moderatorClasses = moderator ? 'text-moderator dark:text-moderator-dark' : '';
  $: ownerClasses = owner ? 'text-owner dark:text-owner-dark' : '';
  $: deletedClasses = message.deleted ? 'text-deleted dark:text-deleted-dark italic' : '';

  // TODO: superchat color
</script>

<div class="p-1 break-words overflow-hidden " class:my-4={message.superchat}>
  {#if message.superchat}
    <strong class="mr-1 underline">{message.superchat.amount}</strong>
  {/if}
  <strong
    class="mr-2 {memberClasses} {moderatorClasses} {ownerClasses}"
  >
    {message.author.name}
  </strong>
  {#each message.message as run}
    {#if run.type === 'text'}
      <span 
        class="inline {deletedClasses}"
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
