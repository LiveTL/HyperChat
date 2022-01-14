<script lang="ts">
  import { translateMessage } from '../ts/storage';

  let iframe: HTMLIFrameElement;

  const callbacks: { [key: string]: (data: any) => void } = {};

  $: if ($translateMessage) {
    callbacks[$translateMessage.messageID] = $translateMessage.callback;
    iframe.contentWindow?.postMessage(JSON.stringify({
      messageID: $translateMessage.messageID,
      targetLanguage: $translateMessage.targetLanguage,
      text: $translateMessage.text,
      type: 'request'
    } as GTL.TranslatePacket), '*');
    setTimeout(() => {
      if (callbacks && callbacks[$translateMessage.messageID]) {
        delete callbacks[$translateMessage.messageID];
      }
    }, 5000);
  }
  window.addEventListener('message', payload => {
    try {
      const data = JSON.parse(payload.data) as GTL.TranslatePacket;
      if (data.type === 'response') {
        if (callbacks && callbacks[data.messageID]) {
          callbacks[data.messageID](data);
          delete callbacks[data.messageID];
        }
      }
    } catch (e) {
    }
  });
</script>

<iframe
  class="hidden-frame"
  src="https://livetl.github.io/iframe-translator/"
  bind:this={iframe}
  title="Hidden translation frame"
/>

<style>
  .hidden-frame {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border: none;
    filter: opacity(0);
  }
</style>