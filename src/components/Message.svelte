<script lang="ts">
  export let message: Chat.Message;
  export let forceDark = false;
  export let hideName = false;

  const nameClass = 'mr-2 font-bold tracking-wide';
  const generateNameColorClass = (member: boolean, moderator: boolean, owner: boolean, forceDark: boolean) => {
    if (owner && forceDark) {
      return 'text-owner-dark';
    } else if (owner) {
      return 'text-owner dark:text-owner-dark';
    } else if (moderator && forceDark) {
      return 'text-moderator-dark';
    } else if (moderator) {
      return 'text-moderator dark:text-moderator-dark';
    } else if (member && forceDark) {
      return 'text-member-dark';
    } else if (member) {
      return 'text-member dark:text-member-dark';
    } else if (forceDark) {
      return 'text-gray-500';
    } else {
      return 'text-gray-700 dark:text-gray-500';
    }
  };
  const generateDeletedClass = (forceDark: boolean, deleted?: boolean) => {
    if (deleted && forceDark) {
      return 'text-deleted-dark italic';
    } else if (deleted) {
      return 'text-deleted dark:text-deleted-dark italic';
    } else {
      return '';
    }
  };

  $: member = message.author.types.some((type) => type === 'member');
  $: moderator = message.author.types.some((type) => type === 'moderator');
  $: owner = message.author.types.some((type) => type === 'owner');
  $: nameColorClass = generateNameColorClass(member, moderator, owner, forceDark);
  $: deletedClass = generateDeletedClass(forceDark, message.deleted);
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
