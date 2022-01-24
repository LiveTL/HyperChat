<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage } from '../ts/storage';
  import Icon from './common/Icon.svelte';
  import { fade } from 'svelte/transition';

  export let text: string;
  let translatedMessage = '';
  export let showOriginal = false;

  $: if ($translateTargetLanguage && $translatorClient) {
    $translatorClient.translate(text, $translateTargetLanguage).then(result => {
      if (result != text) {
        translatedMessage = result;
        $refreshScroll = true;
      }
    });
  }

  $: showTL = Boolean(translatedMessage && !showOriginal);

  $: if (!$translateTargetLanguage) {
    translatedMessage = '';
  }

  const duration = 100;
</script>

<span 
  class="{
    showTL ? 'dark:bg-secondary-600 bg-secondary-50' : ''
  } text-black dark:text-white"
  class:entrance-animation={translatedMessage}
  class:p-1={translatedMessage}
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
