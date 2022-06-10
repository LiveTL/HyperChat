<script lang="ts">
  import { onDestroy, afterUpdate, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import dark from 'smelte/src/dark';
  import WelcomeMessage from './WelcomeMessage.svelte';
  import Message from './Message.svelte';
  import PinnedMessage from './PinnedMessage.svelte';
  import PaidMessage from './PaidMessage.svelte';
  import MembershipItem from './MembershipItem.svelte';
  import ReportBanDialog from './ReportBanDialog.svelte';
  import SuperchatViewDialog from './SuperchatViewDialog.svelte';
  import StickyBar from './StickyBar.svelte';
  import {
    paramsTabId,
    paramsFrameId,
    paramsIsReplay,
    Theme,
    YoutubeEmojiRenderMode,
    chatUserActionsItems
  } from '../ts/chat-constants';
  import { isAllEmoji, isChatMessage, isPrivileged, responseIsAction } from '../ts/chat-utils';
  import Button from 'smelte/src/components/Button';
  import {
    theme,
    showOnlyMemberChat,
    showProfileIcons,
    showUsernames,
    showTimestamps,
    showUserBadges,
    refreshScroll,
    emojiRenderMode,
    useSystemEmojis,
    hoveredItem,
    port,
    selfChannelId,
    alertDialog,
    stickySuperchats,
    currentProgress,
    enableStickySuperchatBar
  } from '../ts/storage';

  const welcome = { welcome: true, message: { messageId: 'welcome' } };
  type Welcome = typeof welcome;

  const CHAT_HISTORY_SIZE = 150;
  const TRUNCATE_SIZE = 20;
  let messageActions: (Chat.MessageAction | Welcome)[] = [];
  let pinned: Ytc.ParsedPinned | null;
  let div: HTMLElement;
  let isAtBottom = true;
  let truncateInterval: number;
  const isReplay = paramsIsReplay;
  let ytDark = false;
  const smelteDark = dark();

  type MessageBlocker = (a: Chat.MessageAction) => boolean;

  const memberOnlyBlocker: MessageBlocker = (a) => (
    $showOnlyMemberChat && isChatMessage(a) && !isPrivileged(a.message.author.types)
  );

  const emojiSpamBlocker: MessageBlocker = (a) => (
    isChatMessage(a) &&
    $emojiRenderMode !== YoutubeEmojiRenderMode.SHOW_ALL &&
    isAllEmoji(a)
  );

  const messageBlockers = [memberOnlyBlocker, emojiSpamBlocker];

  const shouldShowMessage = (m: Chat.MessageAction): boolean => (
    !messageBlockers.some(blocker => blocker(m))
  );

  const isWelcome = (m: Chat.MessageAction | Welcome): m is Welcome =>
    'welcome' in m;

  const checkAtBottom = () => {
    isAtBottom =
      Math.ceil(div.clientHeight + div.scrollTop) >= div.scrollHeight - 2;
  };

  const scrollToBottom = () => {
    if (div == null) return;
    div.scrollTop = div.scrollHeight;
  };

  const checkTruncateMessages = (): void => {
    const diff = messageActions.length - CHAT_HISTORY_SIZE;
    if (diff > TRUNCATE_SIZE) messageActions.splice(0, diff);
    messageActions = messageActions;
  };

  const newMessages = (
    messagesAction: Chat.MessagesAction, isInitial: boolean
  ) => {
    if (!isAtBottom) return;
    // On replays' initial data, only show messages with negative timestamp
    if (isInitial && isReplay) {
      messageActions.push(...filterTickers(messagesAction.messages).filter(
        (a) => a.message.timestamp.startsWith('-') && shouldShowMessage(a)
      ));
    } else {
      messageActions.push(...filterTickers(messagesAction.messages).filter(shouldShowMessage));
    }
    if (!isInitial) checkTruncateMessages();
  };

  const onBonk = (bonk: Ytc.ParsedBonk) => {
    messageActions.forEach((action) => {
      if (isWelcome(action)) return;
      if (action.message.author.id === bonk.authorId) {
        action.deleted = { replace: bonk.replacedMessage };
      }
    });
  };

  const filterTickers = (items: Chat.MessageAction[]): Chat.MessageAction[] => {
    const keep: Chat.MessageAction[] = [];
    const discard: Ytc.ParsedTicker[] = [];
    items.forEach(item => {
      if (
        'tickerDuration' in item.message &&
        !$stickySuperchats.some(sc => sc.messageId === item.message.messageId)
      ) discard.push(item.message);
      else keep.push(item);
    });
    if ($enableStickySuperchatBar && discard.length) {
      $stickySuperchats = [
        ...discard,
        ...$stickySuperchats
      ];
    }
    return keep;
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

  const onChatAction = (action: Chat.Actions, isInitial = false) => {
    switch (action.type) {
      case 'messages':
        newMessages(action, isInitial);
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
      case 'playerProgress':
        $currentProgress = action.playerProgress;
        break;
      case 'forceUpdate':
        messageActions = [...action.messages].filter(shouldShowMessage);
        if (action.showWelcome) {
          messageActions = [...messageActions, welcome];
        }
        break;
    }
  };

  const updateTheme = (theme: Theme, ytDark = false) => {
    if (theme === Theme.YOUTUBE) {
      smelteDark.set(ytDark);
      return;
    }
    smelteDark.set(theme === Theme.DARK);
    if (theme === Theme.LIGHT) document.body.classList.add('bg-gray-50');
    else document.body.classList.remove('bg-gray-50');
  };

  const onPortMessage = (response: Chat.BackgroundResponse) => {
    if (responseIsAction(response)) {
      onChatAction(response);
      return;
    }
    switch (response.type) {
      case 'initialData':
        response.initialData.forEach((action) => {
          onChatAction(action, true);
        });
        messageActions = [...messageActions, welcome];
        $selfChannelId = response.selfChannelId;
        break;
      case 'themeUpdate':
        ytDark = response.dark;
        break;
      case 'chatUserActionResponse':
        $alertDialog = {
          title: response.success ? 'Success!' : 'Error',
          message: chatUserActionsItems.find(v => v.value === response.action)
            ?.messages[response.success ? 'success' : 'error'] ?? '',
          color: response.success ? 'primary' : 'error'
        };
        if (response.success) {
          messageActions = messageActions.filter(
            (a) => {
              if (isWelcome(a)) return true;
              return a.message.author.id !== response.message.author.id;
            }
          );
        }
        break;
      case 'registerClientResponse':
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

    $port = chrome.runtime.connect();

    $port?.onMessage.addListener(onPortMessage);

    $port?.postMessage({
      type: 'registerClient',
      frameInfo,
      getInitialData: true
    });
    $port?.postMessage({
      type: 'getTheme',
      frameInfo
    });
  };

  const onRefresh = () => {
    if (isAtBottom) {
      scrollToBottom();
    }
    tick().then(checkAtBottom);
  };

  $: if ($refreshScroll) {
    onRefresh();
    $refreshScroll = false;
  }

  afterUpdate(onRefresh);

  onDestroy(() => {
    $port?.disconnect();
    if (truncateInterval) window.clearInterval(truncateInterval);
  });

  $: updateTheme($theme, ytDark);
  // Scroll to bottom when any of these settings change
  $: ((..._a: any[]) => scrollToBottom())(
    $showProfileIcons, $showUsernames, $showTimestamps, $showUserBadges
  );

  const containerClass = 'h-screen w-screen text-black dark:text-white dark:bg-black dark:bg-opacity-25';

  const isSuperchat = (action: Chat.MessageAction) => (action.message.superChat || action.message.superSticker);
  const isMembership = (action: Chat.MessageAction) => (action.message.membership);

  $: $useSystemEmojis, onRefresh();

  const setHover = (action: Chat.MessageAction | Welcome | null) => {
    if (action == null) $hoveredItem = null;
    else if (!('welcome' in action)) $hoveredItem = action.message.messageId;
  };

  const clearStickySuperchats = () => {
    $stickySuperchats = [];
  };
  $: if (!$enableStickySuperchatBar) clearStickySuperchats();
</script>

<ReportBanDialog />
<SuperchatViewDialog />

<svelte:window on:resize={scrollToBottom} on:load={onLoad} />

<div class={containerClass} style="font-size: 13px">
  <div class="absolute w-full h-full flex justify-end flex-col">
    <div bind:this={div} on:scroll={checkAtBottom} class="content overflow-y-scroll">
      {#each messageActions as action (action.message.messageId)}
        <div
          class="{isWelcome(action) ? '' : 'flex'} hover-highlight p-1.5 w-full block"
          on:mouseover={() => setHover(action)}
          on:focus={() => setHover(action)}
          on:mouseout={() => setHover(null)}
          on:blur={() => setHover(null)}
        >
          {#if isWelcome(action)}
            <WelcomeMessage />
          {:else if isSuperchat(action)}
            <PaidMessage message={action.message} />
          {:else if isMembership(action)}
            <MembershipItem message={action.message} />
          {:else}
            <Message
              message={action.message}
              deleted={action.deleted}
            />
          {/if}
        </div>
      {/each}
    </div>
  </div>
  <div class="absolute top-0 w-full">
    {#if $enableStickySuperchatBar}
      <StickyBar />
    {/if}
    {#if pinned}
      <div class="mx-2 mt-2">
        <PinnedMessage pinned={pinned} />
      </div>
    {/if}
  </div>
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
  .hover-highlight {
    /* transition: 0.1s; */
    background-color: transparent;
  }
  .hover-highlight:hover {
    background-color: #80808040;
  }
  * :global(::-webkit-scrollbar) {
    width: 4px;
    height: 4px;
  }
  * :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  * :global(::-webkit-scrollbar-thumb) {
    background: #888;
  }
  * :global(::-webkit-scrollbar-thumb:hover) {
    background: #555;
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: #888 transparent;
  }
</style>
