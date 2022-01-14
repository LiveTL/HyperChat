<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { messageTranslationQueue } from '../ts/storage';

  let iframe: HTMLIFrameElement;

  const callbacks: { [key: string]: (data: any) => void } = {};

  $: if ($messageTranslationQueue) {
    while (1) {
      console.log($messageTranslationQueue);
      const front = $messageTranslationQueue.pop();
      if (!front) break;
      callbacks[front.messageID] = front.callback;
      iframe.contentWindow?.postMessage(JSON.stringify({
        messageID: front.messageID,
        targetLanguage: front.targetLanguage,
        text: front.text,
        type: 'request'
      } as GTL.TranslatePacket), '*');
    }
  }

  function onMessage(event: MessageEvent) {
    const data: GTL.TranslatePacket | null = JSON.parse(event.data);
    if (data && data.type === 'response') {
      if (callbacks && callbacks[data.messageID]) {
        callbacks[data.messageID](data);
        delete callbacks[data.messageID];
      }
    }
  }

  onMount(() => {
    window.addEventListener('message', onMessage);
  });

  onDestroy(() => {
    window.removeEventListener('message', onMessage);
  });

  // const host = 'https://livetl.github.io';
  const host = 'http://localhost:42069';
</script>

<iframe
  class="hidden-frame"
  src="{host}/iframe-translator/"
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