<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage, sugoiTranslatorOfflineClient, sugoiTranslatorOfflineEnabled } from '../ts/storage';
  import Icon from './common/Icon.svelte';
  import { Theme } from '../ts/chat-constants';

  export let forceTLColor: Theme = Theme.YOUTUBE;

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

  $: if ($sugoiTranslatorOfflineEnabled) {
    try {
        $sugoiTranslatorOfflineClient.translate(text).then(result => {
        if (result !== text) {
          translatedLanguage = $translateTargetLanguage;
          translatedMessage = result;
          $refreshScroll = true;
        }
      })
    } catch(e) {
      // do nothing, Sugoi Translator Offline server is not available
    }
  }

  $: showTL = Boolean(translatedMessage && !showOriginal && translatedMessage.trim() !== text.trim());

  $: if ($translateTargetLanguage !== translatedLanguage) {
    translatedMessage = '';
    translatedLanguage = '';
  }

  $: if (!$sugoiTranslatorOfflineEnabled) {
    translatedMessage = '';
    translatedLanguage = '';
  }

  $: translatedColor = forceTLColor === Theme.DARK
    ? 'text-translated-dark'
    : `text-translated-light ${forceTLColor === Theme.YOUTUBE ? 'dark:text-translated-dark' : ''}`;
</script>

<span 
  class={showTL ? translatedColor : ''}
  class:cursor-pointer={translatedMessage}
  class:entrance-animation={translatedMessage}
  on:click={() => {
    if (translatedMessage) {
      showOriginal = !showOriginal;
      $refreshScroll = true;
    }
  }}
>
  <span>
    {showTL ? translatedMessage : text}
  </span>
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
