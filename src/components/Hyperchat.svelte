<script lang="ts">
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import dark from 'smelte/src/dark';
  import WelcomeMessage from './WelcomeMessage.svelte';
  import Message from './Message.svelte';
  import PinnedMessage from './PinnedMessage.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import MembershipItem from './MembershipItem.svelte';
  import { paramsTabId, paramsFrameId } from '../ts/chat-constants';
  import Button from 'smelte/src/components/Button';

  type Welcome = { welcome: true };

  const CHAT_HISTORY_SIZE = 250;
  let messageActions: (Chat.MessageAction | Welcome)[] = [];
  let pinned: Ytc.ParsedPinned | null;
  let div: HTMLElement;
  let isAtBottom = true;
  let port: Chat.Port;
  let truncateInterval: number;

  const isChatAction = (r: Chat.BackgroundResponse): r is Chat.Actions =>
    ['message', 'bonk', 'delete', 'pin', 'unpin', 'playerProgress', 'forceUpdate'].includes(r.type);

  const isWelcome = (m: Chat.MessageAction | Welcome): m is Welcome =>
    'welcome' in m;

  const checkAtBottom = () => {
    isAtBottom =
      Math.ceil(div.clientHeight + div.scrollTop) >= div.scrollHeight - 2;
  };

  const scrollToBottom = () => {
    div.scrollTop = div.scrollHeight;
  };

  const truncateMessages = (): void => {
    if (!isAtBottom) return;
    const diff = messageActions.length - CHAT_HISTORY_SIZE;
    if (diff < 0) return;
    messageActions.splice(0, diff);
    messageActions = messageActions;
  };

  const newMessage = (messageAction: Chat.MessageAction) => {
    if (!isAtBottom) return;
    messageActions.push(messageAction);
    messageActions = messageActions;
  };

  const onBonk = (bonk: Ytc.ParsedBonk) => {
    messageActions.forEach((action) => {
      if (isWelcome(action)) return;
      if (action.message.author.id === bonk.authorId) {
        action.deleted = { replace: bonk.replacedMessage };
      }
    });
  };

  const onDelete = (deletion: Ytc.ParsedDeleted) => {
    messageActions.some((action) => {
      if (isWelcome(action)) return false;
      if (action.message.messageId === deletion.messageId) {
        action.deleted = { replace: deletion.replacedMessage };
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
      case 'forceUpdate':
        messageActions = [...action.messages];
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
        messageActions = [...messageActions, { welcome: true }];
        break;
      case 'themeUpdate':
        dark().set(response.dark);
        break;
      default:
        console.error('Unknown payload type', { port, response });
        break;
    }
  };

  // Doesn't work well with onMount, so onLoad will have to do
  const onLoad = () => {
    document.body.classList.add('overflow-hidden');

    if (paramsTabId == null || paramsFrameId == null || paramsTabId.length < 1 || paramsFrameId.length < 1) {
      console.error('No tabId or frameId found from params');
      return;
    }

    const frameInfo = {
      tabId: parseInt(paramsTabId),
      frameId: parseInt(paramsFrameId)
    };
    port = chrome.runtime.connect();
    port.onMessage.addListener(onPortMessage);

    port.postMessage({
      type: 'registerClient',
      frameInfo,
      getInitialData: true
    });
    port.postMessage({
      type: 'getTheme',
      frameInfo
    });
  };

  onMount(() => {
    truncateInterval = window.setInterval(truncateMessages, 10000);
  });

  afterUpdate(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
    tick().then(checkAtBottom);
  });

  onDestroy(() => {
    port.disconnect();
    if (truncateInterval) window.clearInterval(truncateInterval);
  });

  const containerClass = 'h-screen w-screen text-black dark:text-white dark:bg-black dark:bg-opacity-25';
  const contentClass = 'content absolute overflow-y-scroll w-full h-full flex-1 px-2';
  const pinnedClass = 'absolute top-2 inset-x-2';
</script>

<svelte:window on:resize={scrollToBottom} on:load={onLoad} />

<div class={containerClass} style="font-size: 13px">
  <div class={contentClass} bind:this={div} on:scroll={checkAtBottom}>
    {#each messageActions as action}
      <div class="my-2">
        {#if isWelcome(action)}
          <WelcomeMessage />
        {:else if (action.message.superChat || action.message.superSticker)}
          <PaidMessage message={action.message} />
        {:else if action.message.membership}
          <MembershipItem message={action.message} />
        {:else}
          <Message message={action.message} deleted={action.deleted} />
        {/if}
      </div>
    {/each}
  </div>
  {#if pinned}
    <div class={pinnedClass}>
      <PinnedMessage pinned={pinned} />
    </div>
  {/if}
  {#if !isAtBottom}
    <div
      class="absolute left-1/2 transform -translate-x-1/2 bottom-0 pb-1"
      transition:fade={{ duration: 150 }}
    >
      <Button icon="arrow_downward" on:click={scrollToBottom} small />
    </div>
  {/if}
</div>

<style>
  .content {
    scrollbar-width: thin;
    scrollbar-color: #888 transparent;
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
