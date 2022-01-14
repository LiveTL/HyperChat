<script lang="ts">
import { onMount, tick } from 'svelte';

  import { messageTranslationQueue, translateTargetLanguage, refreshScroll } from '../ts/storage';

  export let text: string;
  let translatedMessage = '';

  onMount(() => {
    $messageTranslationQueue.push({
      messageID: `message-${Math.random().toString()}`,
      targetLanguage: $translateTargetLanguage,
      text,
      callback: (response) => {
        translatedMessage = response.text;
        $refreshScroll = true;
      }
    });
    $messageTranslationQueue = $messageTranslationQueue;
  });
</script>

{#if translatedMessage}
  <span class="p-1 bg-primary-400">
    {translatedMessage}  
  </span>
{/if}