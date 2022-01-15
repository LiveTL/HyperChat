<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage } from '../ts/storage';
  import Icon from './common/Icon.svelte';
  import { fade } from 'svelte/transition';

  export let text: string;
  let translatedMessage = '';
  export let showOriginal = false;

  $: if ($translateTargetLanguage && $translatorClient) {
    $translatorClient.translate(text).then(result => {
      translatedMessage = result;
      $refreshScroll = true;
    });
  }

  $: showTL = Boolean(translatedMessage && !showOriginal);

  const duration = 100;
</script>

<span 
  class="{
    showTL ? 'p-1 dark:bg-secondary-600 bg-secondary-50' : ''
  } text-black dark:text-white"
  class:entrance-animation={translatedMessage}
>
  {#if !showTL}
    <span in:fade={{duration: translatedMessage ? duration : 0}}>
      {text}
    </span>
  {/if}
  {#if showTL}
    <span in:fade={{duration}}>
      {translatedMessage}
    </span>
  {/if}
  {#if translatedMessage}
    <span style="transform: translateY(2px);">
      <Icon xs={true} block={false}>
        translate
      </Icon>
    </span>
  {/if}
</span>
