<script lang="ts">
  import { translatorClient } from '../ts/storage';

  export let text: string;
  let translatedMessage = '';

  $: if ($translatorClient) {
    $translatorClient.translate(text).then(result => {
      translatedMessage = result;
    });
  }
</script>

{#if translatedMessage}
  <span class="p-1 bg-primary-400 entrace-animation">
    {translatedMessage}
  </span>
{/if}

<style>
  .entrace-animation {
    animation: entrance 0.2s;
  }
  @keyframes entrance {
    from {
      opacity: 0;
      transform: translateY(50%);
    }
    to {
      opacity: 1;
      transform: translateY(0px);
    }
  }
</style>