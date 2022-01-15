<script lang="ts">
  import { refreshScroll, translatorClient, translateTargetLanguage } from '../ts/storage';
  import Icon from './common/Icon.svelte';

  export let text: string;
  let translatedMessage = '';
  export let showOriginal = false;

  $: if ($translateTargetLanguage && $translatorClient) {
    $translatorClient.translate(text).then(result => {
      translatedMessage = result;
      $refreshScroll = true;
    });
  }

  $: showTL = translatedMessage && !showOriginal;
</script>

<span 
  class={showTL ? 'p-1 dark:bg-secondary-600 bg-secondary-50' : ''}
  class:entrance-animation={translatedMessage}
>
  {showTL ? translatedMessage : text}
  {#if translatedMessage}
    <span style="transform: translateY(2px);">
      <Icon xs={true} block={false}>
        translate
      </Icon>
    </span>
  {/if}
</span>

<style>
  /* .entrance-animation {
    animation: entrance 0.2s;
  }
  @keyframes entrance {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  } */
</style>