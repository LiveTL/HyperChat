<script lang="ts">
  import WelcomeMessage from './WelcomeMessage.svelte';
  import Message from './Message.svelte';
  import dark from 'smelte/src/dark';
  import { YtcQueue } from '../ts/queue';
  import { onMount, onDestroy } from 'svelte';
  import { isFrameInfoMsg } from '../ts/chat-utils';
  import type { Writable } from 'svelte/store';

  const CHAT_HISTORY_SIZE = 250;
  let queue: YtcQueue | undefined;
  let messages: Writable<Chat.Message[]> | undefined;

  const onWindowMessage = (message: MessageEvent<Chat.WindowMessage>) => {
    const data = message.data;
    if (!isFrameInfoMsg) return;

    const port = chrome.runtime.connect();
    port.postMessage({
      type: 'registerClient',
      frameInfo: data.frameInfo,
      getInitialData: true
    });

    port.onMessage.addListener((payload: Chat.Payload) => {
      switch (payload.type) {
        case 'actionChunk':
          if (!queue) {
            queue = new YtcQueue(CHAT_HISTORY_SIZE, payload.isReplay);
            messages = queue.messagesStore;
          }
          queue.addToQueue(payload);
          break;
        case 'playerProgress':
          if (!queue) return;
          queue.updatePlayerProgress(payload.playerProgress);
          break;
        case 'themeUpdate':
          dark().set(payload.dark);
          break;
        default:
          console.error('Unknown payload type', port, payload);
          break;
      }
    });

    port.postMessage({
      type: 'getTheme',
      frameInfo: data.frameInfo
    });
  };

  onMount(() => {
    window.addEventListener('message', onWindowMessage);
  });

  onDestroy(() => {
    if (!queue) return;
    queue.cleanUp();
  });
</script>

<div class="content px-2.5 overflow-y-scroll h-screen">
  <WelcomeMessage />
  {#if messages}
    {#each $messages as message}
      <Message message={message} deleted={message.deleted} />
    {/each}
  {/if}
</div>

<style>
  .content {
    scrollbar-width: thin;
  }
  .content::-webkit-scrollbar {
    width: 4px;
  }
  .content::-webkit-scrollbar-track {
    background: transparent;
  }
  .content::-webkit-scrollbar-thumb {
    background: #888;
  }
  .content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>
