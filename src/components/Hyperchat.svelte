<script lang="ts">
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Button } from 'smelte';
  import dark from 'smelte/src/dark';
  import WelcomeMessage from './WelcomeMessage.svelte';
  import Message from './Message.svelte';
  import PinnedMessage from './PinnedMessage.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import { isFrameInfoMsg } from '../ts/chat-utils';

  type Welcome = { welcome: true };

  const CHAT_HISTORY_SIZE = 250;
  let messages: (Ytc.ParsedMessage | Welcome)[] = [];
  let pinned: Ytc.ParsedPinned | null;
  let div: HTMLElement;
  let isAtBottom = true;
  let port: Chat.Port;

  const isChatAction = (r: Chat.BackgroundResponse): r is Chat.Actions =>
    ['message', 'bonk', 'delete', 'pin', 'unpin'].includes(r.type);

  const isWelcome = (m: Ytc.ParsedMessage | Welcome): m is Welcome =>
    (m as Welcome).welcome;

  const checkAtBottom = () => {
    isAtBottom =
      Math.ceil(div.clientHeight + div.scrollTop) >= div.scrollHeight - 2;
  };

  const scrollToBottom = () => {
    div.scrollTop = div.scrollHeight;
  };

  const newMessage = (messageAction: Chat.MessageAction) => {
    if (!isAtBottom) return;
    const parsedMessage = messageAction.message;
    if (messageAction.deleted) {
      parsedMessage.message = messageAction.deleted.replace;
    }
    messages.push(parsedMessage);
    if (messages.length > CHAT_HISTORY_SIZE) {
      messages.splice(0, 1);
    }
    messages = messages;
  };

  const onBonk = (bonk: Ytc.ParsedBonk) => {
    messages.forEach((m) => {
      if (isWelcome(m)) return;
      if (m.author.id === bonk.authorId) {
        m.message = bonk.replacedMessage;
      }
    });
  };

  const onDelete = (deletion: Ytc.ParsedDeleted) => {
    messages.some((m) => {
      if (isWelcome(m)) return false;
      if (m.messageId === deletion.messageId) {
        m.message = deletion.replacedMessage;
        return true;
      }
      return false;
    });
  };

  const onChatAction = (action: Chat.Actions) => {
    switch (action.type) {
      case 'message':
        newMessage(action);
        break;
      case 'bonk':
        onBonk(action.bonk);
        break;
      case 'delete':
        onDelete(action.deletion);
        break;
      case 'pin':
        pinned = action;
        break;
      case 'unpin':
        pinned = null;
        break;
    }
  };

  const onPortMessage = (response: Chat.BackgroundResponse) => {
    if (isChatAction(response)) {
      onChatAction(response);
      return;
    }
    switch (response.type) {
      case 'initialData':
        response.initialData.forEach(onChatAction);
        messages = [...messages, { welcome: true }];
        break;
      case 'themeUpdate':
        dark().set(response.dark);
        break;
      default:
        console.error('Unknown payload type', { port, response });
        break;
    }
  };

  const onWindowMessage = (message: MessageEvent<Chat.WindowMessage>) => {
    const data = message.data;
    if (!isFrameInfoMsg) return;

    port = chrome.runtime.connect();
    port.postMessage({
      type: 'registerClient',
      frameInfo: data.frameInfo,
      getInitialData: true
    });

    port.onMessage.addListener(onPortMessage);

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

  onDestroy(() => port.disconnect());
</script>

<svelte:window on:resize="{scrollToBottom}" />

<div class="text-black dark:text-white text-xs">
  <div
    class="content px-2.5 overflow-y-scroll h-screen absolute w-screen dark:bg-black dark:bg-opacity-25"
    bind:this={div}
    on:scroll="{checkAtBottom}"
  >
    {#each messages as message}
      <div class="my-2.5">
        {#if isWelcome(message)}
          <WelcomeMessage />
        {:else if (message.superChat || message.superSticker || message.membership)}
          <PaidMessage message={message} />
        {:else}
          <Message message={message} />
        {/if}
      </div>
    {/each}
  </div>
  {#if pinned}
    <div class="absolute px-2.5 w-screen pt-1">
      <PinnedMessage pinned={pinned} />
    </div>
  {/if}
  {#if !isAtBottom}
    <div
      class="absolute left-1/2 transform -translate-x-1/2 bottom-0 pb-1"
      transition:fade={{ duration: 150 }}
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
