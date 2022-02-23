<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage } from '../ts/storage';
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

  $: showTL = Boolean(translatedMessage && !showOriginal);

  $: if ($translateTargetLanguage !== translatedLanguage) {
    translatedMessage = '';
    translatedLanguage = '';
  }

  $: console.log(forceTLColor);

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
