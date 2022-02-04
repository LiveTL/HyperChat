<script lang="ts">
  import MessageRun from './MessageRuns.svelte';
  import Icon from './common/Icon.svelte';
  import {
    showProfileIcons,
    showUsernames,
    showTimestamps,
    showUserBadges
  } from '../ts/storage';

  export let message: Ytc.ParsedMessage;
  export let deleted: Chat.MessageDeletedObj | null = null;
  export let forceDark = false;
  export let hideName = false;

  const nameClass = 'font-bold tracking-wide cursor-auto align-middle';
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

  let member = false;
  let verified = false;
  let moderator = false;
  let owner = false;
  $: message.author.types.forEach((type) => {
    if (type === 'member') member = true;
    else if (type === 'verified') verified = true;
    else if (type === 'moderator') moderator = true;
    else if (type === 'owner') owner = true;
  });
  $: nameColorClass = generateNameColorClass(member, moderator, owner, forceDark);

  $: if (deleted != null) {
    message.message = deleted.replace;
  }

  $: showUserMargin = $showProfileIcons || $showUsernames || $showTimestamps ||
    ($showUserBadges && (moderator || verified || member));
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div 
  class="inline-flex flex-row gap-2 break-words overflow-hidden w-full"
  on:click|stopPropagation
>
  {#if !hideName && $showProfileIcons}
    <img
      class="h-5 w-5 inline align-middle rounded-full cursor-auto flex-none"
      src={message.author.profileIcon.src}
      alt={message.author.profileIcon.alt}
    />
  {/if}
  <div>
    {#if !hideName}
      <span
        class="text-xs mr-1 text-gray-700 dark:text-gray-600 align-middle"
        class:hidden={!$showTimestamps}
      >
        {message.timestamp}
      </span>
      <span
        class="{nameClass} {nameColorClass}"
        class:hidden={!$showUsernames}
      >
        {message.author.name}
      </span>
      <span class="align-middle" class:hidden={!$showUserBadges}>
        {#if moderator}
          <Icon class="inline align-middle" small>build</Icon>
        {:else if verified}
          <Icon
            class="inline align-middle text-gray-500"
            small
          >
            verified
          </Icon>
        {:else if member && message.author.customBadge}
          <img
            class="h-4 w-4 inline align-middle"
            src={message.author.customBadge.src}
            alt={message.author.customBadge.alt}
          />
        {/if}
      </span>
      <span class="mr-1.5" class:hidden={!showUserMargin} />
    {/if}
    <MessageRun runs={message.message} {forceDark} deleted={deleted != null} />
  </div>
</div>
