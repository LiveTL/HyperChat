<script lang="ts">
  import WelcomeMessage from './WelcomeMessage.svelte';
  import dark from 'smelte/src/dark';

  window.addEventListener('message', (message) => {
    const data = message.data;
    if (data?.type === 'frameInfo') {
      const port = chrome.runtime.connect();
      port.postMessage({
        type: 'registerClient',
        frameInfo: data.frameInfo,
        getInitialData: true
      });

      port.onMessage.addListener((payload: Chat.Payload) => {
        switch (payload.type) {
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
    }
  });
</script>

<div class="content px-2.5 overflow-y-scroll h-screen">
  <WelcomeMessage />
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
