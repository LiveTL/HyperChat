<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage } from '../ts/storage';
  import Icon from './common/Icon.svelte';
  import { fade } from 'svelte/transition';

  export let forceDark = false;

  export let text: string;
  let translatedMessage = '';
  let translatedLanguage = '';
  let showOriginal = false;

  $: if ($translateTargetLanguage && $translatorClient) {
    $translatorClient.translate(text, $translateTargetLanguage).then(result => {
      if (result !== text) {
        translatedLanguage = $translateTargetLanguage;
        translatedMessage = result;
        $refreshScroll = true;
      }
    });
  }

  $: showTL = Boolean(translatedMessage && !showOriginal);

  $: if ($translateTargetLanguage !== translatedLanguage) {
    translatedMessage = '';
    translatedLanguage = '';
  }

  const duration = 100;

  $: translatedColor = forceDark ? 'text-translated-dark' : 'dark:text-translated-dark text-translated-light';
  $: stockTextColor = forceDark ? 'text-white' : 'dark:text-white text-black';
</script>

<span 
  class={
    showTL ? translatedColor : stockTextColor
  }
  class:cursor-pointer={translatedMessage}
  class:entrance-animation={translatedMessage}
  on:click|stopPropagation={() => {
    if (translatedMessage) {
      showOriginal = !showOriginal;
      $refreshScroll = true;
    }
  }}
>
  {#if !showTL}
    <span in:fade={{ duration: translatedMessage ? duration : 0 }}>
      {text}
    </span>
  {/if}
  {#if showTL}
    <span in:fade={{ duration }}>
      {translatedMessage}
    </span>
  {/if}
  {#if translatedMessage}
    <span class="shifted-icon">
      <Icon xs={true} block={false}>
        translate
      </Icon>
    </span>
  {/if}
</span>

<style>
  .shifted-icon  :global(.material-icons) {
    transform: translateY(1px);
  }  
</style>
