<script lang="ts">
  import {
    theme,
    showOnlyMemberChat,
    showProfileIcons,
    showTimestamps,
    showUsernames,
    showUserBadges,
    emojiRenderMode,
    autoLiveChat,
    useSystemEmojis, isRegexFilter, isNickNameFilter, filterArray, isFilterActive
  } from '../../ts/storage';
  import { Theme, themeItems, emojiRenderItems } from '../../ts/chat-constants';
  import Card from '../common/Card.svelte';
  import Radio from '../common/RadioGroupStore.svelte';
  import Checkbox from '../common/CheckboxStore.svelte';
  import Icon from '../common/Icon.svelte';
  import MessageTranslationSettings from './MessageTranslationSettings.svelte';
  import dark from 'smelte/src/dark';
  import FilterTable from '../common/FilterTable.svelte';

  const willChangeOnNextChunkMessage = (
    'Settings listed below will take effect when the next chat message chunk arrives.'
  );

  const darkStore = dark();
  $: switch ($theme) {
    case Theme.DARK:
      darkStore.set(true);
      break;
    case Theme.LIGHT:
      darkStore.set(false);
      break;
    case Theme.YOUTUBE:
      if (window.location.search.includes('dark')) darkStore.set(true);
      else darkStore.set(false);
      break;
    default:
      break;
  }

  $: console.debug({
    theme: $theme,
    showProfileIcons: $showProfileIcons,
    showTimestamps: $showTimestamps,
    showUsernames: $showUsernames
  });
</script>

<Card title="Appearance" icon="format_paint">
  <div class="flex items-center gap-2">
    <h6>Theme:</h6>
    <Radio store={theme} items={themeItems} />
  </div>
</Card>

<Card title="Messages" icon="message">
  <Checkbox name="Show profile icons" store={showProfileIcons} />
  <Checkbox name="Show timestamps" store={showTimestamps} />
  <Checkbox name="Show usernames" store={showUsernames} />
  <Checkbox name="Show user badges" store={showUserBadges} />
</Card>

<Card title="Emojis" icon="emoji_emotions">
  <Checkbox name="Use system emojis when possible" store={useSystemEmojis} />
  <i>{willChangeOnNextChunkMessage}</i>
  <Radio store={emojiRenderMode} items={emojiRenderItems} vertical />
</Card>

<Card title="Additional Options" icon="tune">
  <a
    href="https://myaccount.google.com/blocklist"
    class="ml-2 dark:text-primary-50 text-primary-900"
    target="_blank"
  >
    <span class="underline">Unblock chat users</span>
    <Icon class="inline align-middle" small>open_in_new</Icon>
  </a>
  <Checkbox name="Automatically switch to Live Chat" store={autoLiveChat} />
  <MessageTranslationSettings />
</Card>

<Card title="Filters" icon="filter_list">
  <i>{willChangeOnNextChunkMessage}</i>
  <Checkbox name="Show only member chat messages" store={showOnlyMemberChat} />
</Card>

<Card title="RegEx Filter" icon="filter_list">
  <i>{willChangeOnNextChunkMessage}</i>
  <Checkbox name="Enable filtering" store={isFilterActive} />
  {#if $isFilterActive}
    <Checkbox name="Filter as a regular expression" store={isRegexFilter} />
    <Checkbox name="Filter nicknames" store={isNickNameFilter} />
    <FilterTable store={filterArray} />
  {/if}
</Card>
