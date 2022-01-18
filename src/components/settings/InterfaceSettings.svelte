<script lang="ts">
  import {
    theme,
    showProfileIcons,
    showTimestamps,
    showUsernames,
    showUserBadges
  } from '../../ts/storage';
  import { themeItems } from '../../ts/chat-constants';
  import Card from '../common/Card.svelte';
  import Radio from '../common/RadioGroupStore.svelte';
  import Checkbox from '../common/CheckboxStore.svelte';

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
