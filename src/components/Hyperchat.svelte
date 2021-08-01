<script>
  import { onMount } from 'svelte';
  import { Queue } from '../js/queue';

  const CHAT_HISTORY_SIZE = 250;
  const messages = new Array(CHAT_HISTORY_SIZE);
  const messageQueue = new Queue();
  const isAtBottom = true;

  const processMessagePayload = (payload) => {
    if (!payload.isReplay && !interval) {
      const runQueue = () => videoProgressUpdated(Date.now() / 1000);
      interval = setInterval(runQueue, 250);
      runQueue();
      runQueue();
    }
    /** Separate each action */
    const messages = payload.messages;
    const bonks = payload.bonks;
    const deletions = payload.deletions;
    /** Sort and add messages to queue */
    for (const message of messages.sort(
      (m1, m2) => m1.showtime - m2.showtime
    )) {
      checkDeleted(message, bonks, deletions);
      queued.push({
        timestamp: message.showtime / 1000,
        message: message
      });
    }
    /** Handle deletions and bonks */
    const wasBottom = checkIfBottom();
    messages.forEach((message) =>
      checkDeleted(message, bonks, deletions)
    );
    if ((payload.isInitial || payload.isReplay) && showWelcome === 'future') {
      showWelcome = 'now';
    }
    if (wasBottom) {
      $nextTick(scrollToBottom);
    }
  };

  onMount(() => {
    window.addEventListener('message', (message) => {
      const data = message.data;
      /** Connect to background messaging as client */
      if (data.type === 'frameInfo') {
        const port = chrome.runtime.connect();
        port.postMessage({
          type: 'registerClient',
          frameInfo: data.frameInfo,
          getInitialData: true
        });
        port.onMessage.addListener((payload) => {
          if (payload.type === 'actionChunk') {
            processMessagePayload(payload);
          } else if (payload.type === 'playerProgress' && !interval) {
            videoProgressUpdated(payload.playerProgress);
          }
        });
      }
      /** Handle YT values */
      const d = JSON.parse(JSON.stringify(data));
      isAtBottom = checkIfBottom();
      if (d['yt-live-chat-set-dark-theme'] != null) {
        $vuetify.theme.dark = d['yt-live-chat-set-dark-theme'];
        localStorage.setItem('dark_theme', $vuetify.theme.dark.toString());
      }
    });
  });
</script>

<svelte:window on:resize={scrollToBottom}/>

<div>
  
</div>
