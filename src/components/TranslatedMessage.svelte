<script lang="ts">
  import { translateMessage, translateTargetLanguage, refreshScroll } from '../ts/storage';

  export let text: string;
  export let messageID: string;
  let translatedMessage: string;

  $translateMessage = {
    messageID,
    targetLanguage: $translateTargetLanguage,
    text,
    callback: (response) => {
      translatedMessage = response.text;
      $refreshScroll = true;
    }
  }
</script>

{#if translatedMessage}
  <div>
    {translatedMessage}  
  </div>
{/if}