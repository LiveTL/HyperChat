<script lang="ts">
  import MessageRun from './MessageRuns.svelte';

  export let message: Ytc.ParsedMessage;
  export let deleted: Chat.MessageDeletedObj | null = null;
  export let forceDark = false;
  export let hideName = false;

  const nameClass = 'mr-2 font-bold tracking-wide cursor-auto align-middle';
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

  $: member = message.author.types.includes('member');
  $: moderator = message.author.types.includes('moderator');
  $: owner = message.author.types.includes('owner');
  $: nameColorClass = generateNameColorClass(member, moderator, owner, forceDark);

  $: if (deleted != null) {
    message.message = deleted.replace;
  }
</script>

<div class="break-words overflow-hidden">
  {#if !hideName}
    <span on:click|stopPropagation class="{nameClass} {nameColorClass}">
      <span class="align-middle">{message.author.name}</span>
      {#if message.author.customBadge}
        <img
          on:click|stopPropagation
          class="h-4 w-4 inline align-middle"
          src={message.author.customBadge.src}
          alt={message.author.customBadge.alt}
        />
      {/if}
    </span>
  {/if}
  <MessageRun runs={message.message} {forceDark} deleted={deleted != null} />
</div>
