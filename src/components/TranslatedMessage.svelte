<script lang="ts">
  import { refreshScroll, translatorClient } from '../ts/storage';

  export let text: string;
  let translatedMessage = '';

  $: if ($translatorClient) {
    $translatorClient.translate(text).then(result => {
      translatedMessage = result;
      $refreshScroll = true;
    });
  }
</script>

{#if translatedMessage}
  <span class="p-1 dark:bg-secondary-600 bg-secondary-50 entrance-animation">
    {translatedMessage}
  </span>
{/if}

<style>
  .entrance-animation {
    animation: entrance 0.2s;
  }
  @keyframes entrance {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>