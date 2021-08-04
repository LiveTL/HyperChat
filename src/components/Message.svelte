<script lang="ts">
  export let message: Chat.Message;
  export let forceDark = false;
  export let hideName = false;

  // FIXME: All these retain previous values when history size reached since its just recycling the same components

  const member = message.author.types.some((type) => type === 'member');
  const moderator = message.author.types.some((type) => type === 'moderator');
  const owner = message.author.types.some((type) => type === 'owner');

  const nameClass = 'mr-2 font-bold tracking-wide';
  let nameColorClass = '';
  if (owner && forceDark) {
    nameColorClass = 'text-owner-dark';
  } else if (owner) {
    nameColorClass = 'text-owner dark:text-owner-dark';
  } else if (moderator && forceDark) {
    nameColorClass = 'text-moderator-dark';
  } else if (moderator) {
    nameColorClass = 'text-moderator dark:text-moderator-dark';
  } else if (member && forceDark) {
    nameColorClass = 'text-member-dark';
  } else if (member) {
    nameColorClass = 'text-member dark:text-member-dark';
  } else if (forceDark) {
    nameColorClass = 'text-gray-500';
  } else {
    nameColorClass = 'text-gray-700 dark:text-gray-500';
  }

  let deletedClass = '';
  $: if (message.deleted && forceDark) {
    deletedClass = 'text-deleted-dark italic';
  } else if (message.deleted) {
    deletedClass = 'text-deleted dark:text-deleted-dark italic';
  }
</script>

<div class="break-words overflow-hidden">
  {#if !hideName}
    <span class="{nameClass} {nameColorClass}">
      {message.author.name}
    </span>
  {/if}
  {#each message.message as run}
    {#if run.type === 'text'}
      <span class="inline {deletedClass}">
        {run.text}
      </span>
    {:else if run.type === 'link'}
      <span>
        <a
          class="inline underline"
          href={run.url}
          target="_blank"
        >
          {run.text}
        </a>
      </span>
    {:else if run.type === 'emote' && run.src}
      <span>
        <img class="h-5 w-5 mx-px inline" src={run.src} alt="emote" />
      </span>
    {/if}
  {/each}
</div>
