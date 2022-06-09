<script lang="ts">
  import MessageRun from './MessageRuns.svelte';
  import Icon from './common/Icon.svelte';
  import Menu from './common/Menu.svelte';
  import {
    showProfileIcons,
    showUsernames,
    showTimestamps,
    showUserBadges,
    hoveredItem,
    port,
    selfChannelId, filterArray, isFilterActive
  } from '../ts/storage';
  import { chatUserActionsItems, Theme } from '../ts/chat-constants';
  import { useBanHammer } from '../ts/chat-actions';

  export let message: Ytc.ParsedMessage;
  export let deleted: Chat.MessageDeletedObj | null = null;
  export let messageId: Chat.MessageAction['message']['messageId'];
  export let forceDark = false;
  export let hideName = false;
  let hiddenClass = '';

  $: message.message.forEach(communication => {
    if ($isFilterActive && $filterArray.length !== 0) {
      $filterArray.forEach(rule => {
        if (!rule.isNicknameFilter) {
          if (communication.type === 'text' && rule.isRegEx && new RegExp(rule.value).test(communication.text)) {
            hiddenClass = 'hidden'; // hidden
            return;
          }
          if (communication.type === 'text' && !rule.isRegEx && communication.text.includes(rule.value)) {
            hiddenClass = 'hidden'; // hidden
            return;
          }
        } else {
          if (message.author.name && rule.isRegEx && new RegExp(rule.value).test(message.author.name)) {
            hiddenClass = 'hidden'; // hidden
            return;
          }
          if (message.author.name && !rule.isRegEx && message.author.name.includes(rule.value)) {
            hiddenClass = 'hidden'; // hidden
            return;
          }
        }
      });
    } else {
      hiddenClass = '';
    }
  });

  const nameClass = 'font-bold tracking-wide align-middle';
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
  
  export let forceTLColor: Theme = Theme.YOUTUBE;

  const menuItems = chatUserActionsItems.map((d) => ({
    icon: d.icon,
    text: d.text,
    value: d.value.toString(),
    onClick: () => useBanHammer(message, d.value, $port)
  }));
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div 
  class="inline-flex flex-row gap-2 break-words w-full overflow-visible {hiddenClass}"
>
  {#if !hideName && $showProfileIcons}
    <a
      href={message.author.url}
      class="flex-shrink-0 {message.author.url ? 'cursor-pointer' : 'cursor-auto'}"
      target="_blank"
    >
      <img
        class="h-5 w-5 inline align-middle rounded-full flex-none"
        src={message.author.profileIcon.src}
        alt={message.author.profileIcon.alt}
      />
    </a>
  {/if}
  <div>
    {#if !hideName}
      <span
        class="text-xs mr-1 text-gray-700 dark:text-gray-600 align-middle"
        class:hidden={!$showTimestamps}
      >
        {message.timestamp}
      </span>
      <a
        href={message.author.url}
        class:cursor-pointer={message.author.url}
        class:cursor-auto={!message.author.url}
        target="_blank"
      >
        <span
          class="{nameClass} {nameColorClass}"
          class:hidden={!$showUsernames}
        >
          {message.author.name}
        </span>
      </a>
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
    <MessageRun runs={message.message} {forceDark} deleted={deleted != null} {forceTLColor} />
  </div>
  {#if message.author.id !== $selfChannelId}
    <Menu items={menuItems} visible={$hoveredItem === messageId} class="mr-2 ml-auto context-menu">
      <Icon slot="activator" style="font-size: 1.5em;">more_vert</Icon>
    </Menu>
  {/if}
</div>
