<script lang="ts">
  import {
    theme,
    showProfileIcons,
    showTimestamps,
    showUsernames,
    showUserBadges
  } from '../../ts/storage';
  import { Theme, themeItems } from '../../ts/chat-constants';
  import Card from '../common/Card.svelte';
  import Radio from '../common/RadioGroupStore.svelte';
  import Checkbox from '../common/CheckboxStore.svelte';
  import dark from 'smelte/src/dark';

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

<Card title="General" icon="tune">
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
