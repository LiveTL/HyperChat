<script lang="ts">
  export let message: Chat.Message;
  export let forceDark = false;

  const member = message.author.types.some((type) => type === 'member');
  const moderator = message.author.types.some((type) => type === 'moderator');
  const owner = message.author.types.some((type) => type === 'owner');
  const superchat = message.superchat;

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

  const superchatClass = superchat ? 'py-4 px-1' : '';
  const superchatStyle = superchat ? `background-color: #${superchat.color}` : '';
  const superchatTextClass = superchat ? 'text-black' : '';

  let deletedClass = '';
  $: if (message.deleted && forceDark) {
    deletedClass = 'text-deleted-dark italic';
  } else if (message.deleted) {
    deletedClass = 'text-deleted dark:text-deleted-dark italic';
  }
</script>

<div
  class="my-2.5 break-words overflow-hidden {superchatClass}"
  style="{superchatStyle}"
>
  {#if message.superchat}
    <strong class="mr-1 underline">{message.superchat.amount}</strong>
  {/if}
  <span
    class="{nameClass} {nameColorClass}"
  >
    {message.author.name}
  </span>
    {#each message.message as run}
      {#if run.type === 'text'}
        <span
          class="inline {deletedClass} {superchatTextClass}"
        >
          {run.text}
        </span>
      {:else if run.type === 'link'}
        <span>
          <a
            class="inline underline {superchatTextClass}"
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
