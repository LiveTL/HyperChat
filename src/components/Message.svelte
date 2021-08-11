<script lang="ts">
  export let message: Ytc.ParsedMessage;
  export let deleted: Chat.MessageDeletedObj | null = null;
  export let forceDark = false;
  export let hideName = false;

  let deletedClass = '';

  const nameClass = 'mr-2 font-bold tracking-wide cursor-auto';
  const generateNameColorClass = (member: boolean, moderator: boolean, owner: boolean, forceDark: boolean) => {
    if (owner && forceDark) {
      return 'text-owner-dark';
    } else if (owner) {
      return 'text-owner-light dark:text-owner-dark';
    } else if (moderator && forceDark) {
      return 'text-moderator-dark';
    } else if (moderator) {
      return 'text-moderator-light dark:text-moderator-dark';
    } else if (member && forceDark) {
      return 'text-member-dark';
    } else if (member) {
      return 'text-member-light dark:text-member-dark';
    } else if (forceDark) {
      return 'text-gray-500';
    } else {
      return 'text-gray-700 dark:text-gray-500';
    }
  };

  $: member = message.author.types.some((type) => type === 'member');
  $: moderator = message.author.types.some((type) => type === 'moderator');
  $: owner = message.author.types.some((type) => type === 'owner');
  $: nameColorClass = generateNameColorClass(member, moderator, owner, forceDark);

  const onDeleted = (deleted: Chat.MessageDeletedObj | null, forceDark: boolean) => {
    if (!deleted) {
      deletedClass = '';
      return;
    }
    message.message = deleted.replace;
    if (forceDark) {
      deletedClass = 'text-deleted-dark italic';
    } else {
      deletedClass = 'text-deleted-light dark:text-deleted-dark italic';
    }
  };
  $: onDeleted(deleted, forceDark);
</script>

<div class="break-words overflow-hidden">
  {#if !hideName}
    <span on:click|stopPropagation class="{nameClass} {nameColorClass}">
      {message.author.name}
    </span>
  {/if}
  {#each message.message as run}
    {#if run.type === 'text'}
      <span on:click|stopPropagation class="inline cursor-auto {deletedClass}">
        {run.text}
      </span>
    {:else if run.type === 'link'}
      <span>
        <a
          class="inline underline"
          href={run.url}
          target="_blank"
          on:click|stopPropagation
        >
          {run.text}
        </a>
      </span>
    {:else if run.type === 'emoji' && run.src}
      <span>
        <img on:click|stopPropagation class="h-5 w-5 mx-px inline" src={run.src} alt={run.alt} />
      </span>
    {/if}
  {/each}
</div>
