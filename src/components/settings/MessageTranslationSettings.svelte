<script lang="ts">
  import {
    translateTargetLanguage
  } from '../../ts/storage';
  import DropdownStore from '../common/DropdownStore.svelte';
  import Card from '../common/Card.svelte';
  import Checkbox from '../common/CheckboxStore.svelte';
  import { AvailableLanguages } from 'iframe-translator';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  let enabled = writable(true);
  $: if (!$enabled) {
    $translateTargetLanguage = '';
  }
  onMount(() =>{
    const unsub = translateTargetLanguage.subscribe(value => {
      $enabled = Boolean(value);
      setTimeout(() => unsub(), 0);
    });
  });
  const priority = [
    'English',
    'Japanese',
    'Indonesian',
    'Korean',
    'Spanish',
    'Chinese',
    'Russian',
    'French',
  ];
</script>

<Card title="Additional Options" icon="translate">
  <Checkbox name="Translate chat messages with Google Translate" store={enabled} />
  {#if $enabled}
    <DropdownStore name="Language"
    store={translateTargetLanguage}
    items={[
      ...priority,
      ...AvailableLanguages.filter(e => !priority.includes(e))
    ]} />
  {/if}
</Card>