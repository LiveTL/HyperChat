<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { YtcQueueMessage } from '../ts/queue';
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import WelcomeMessage from './WelcomeMessage.svelte';
  import Message from './Message.svelte';
  import dark from 'smelte/src/dark';
  import { YtcQueue, isChatMessage } from '../ts/queue';
  import { isFrameInfoMsg } from '../ts/chat-utils';
  import { Button } from 'smelte';

  const CHAT_HISTORY_SIZE = 250;
  let queue: YtcQueue | undefined;
  let messages: Writable<YtcQueueMessage[]> | undefined;
  let div: HTMLElement;
  let isAtBottom = true;

  const checkAtBottom = () => {
    isAtBottom =
      Math.ceil(div.clientHeight + div.scrollTop) >= div.scrollHeight - 2;
  };

  const scrollToBottom = () => {
    div.scrollTop = div.scrollHeight;
  };

  const onWindowMessage = (message: MessageEvent<Chat.WindowMessage>) => {
    const data = message.data;
    if (!isFrameInfoMsg) return;

    const port = chrome.runtime.connect();
    port.postMessage({
      type: 'registerClient',
      frameInfo: data.frameInfo,
      getInitialData: true
    });

    port.onMessage.addListener((payload: Chat.BackgroundPayload) => {
      switch (payload.type) {
        case 'initialDataChunk':
          if (queue) {
            return console.error('Queue already exists at initial data');
          }
          queue = new YtcQueue(
            CHAT_HISTORY_SIZE, payload.isReplay, () => isAtBottom
          );
          messages = queue.messagesStore;
          queue.addInitialData(payload);
          break;
        case 'actionChunk':
          if (!queue) return;
          queue.addActionChunk(payload);
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

  afterUpdate(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
    tick().then(checkAtBottom);
  });

  onDestroy(() => {
    if (!queue) return;
    queue.cleanUp();
  });
</script>

<svelte:window on:resize="{scrollToBottom}" />

<div>
  <div
    class="content px-2.5 overflow-y-scroll h-screen absolute w-screen dark:bg-black dark:bg-opacity-25"
    bind:this={div}
    on:scroll="{checkAtBottom}"
  >
    {#if messages}
      {#each $messages as message}
        {#if isChatMessage(message)}
          <Message message={message} />
        {:else}
          <WelcomeMessage />
        {/if}
      {/each}
    {/if}
  </div>
  {#if !isAtBottom}
    <div
      class="absolute left-1/2 transform -translate-x-1/2 bottom-0 pb-1"
      transition:fade|local={{ duration: 150 }}
    >
      <Button
        small
        icon="arrow_downward"
        on:click="{scrollToBottom}"
        color="blue"
      />
    </div>
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
