import { fixLeaks } from '../ts/ytc-fix-memleaks';
import { frameIsReplay as isReplay } from '../ts/chat-utils';
import sha1 from 'sha-1';

function injectedFunction(): void {
  for (const eventName of ['visibilitychange', 'webkitvisibilitychange', 'blur']) {
    window.addEventListener(eventName, event => {
      event.stopImmediatePropagation();
    }, true);
  }
  const fetchFallback = window.fetch;
  (window as any).fetchFallback = fetchFallback;
  window.fetch = async (...args) => {
    const request = args[0] as Request;
    const url = request.url;
    const result = await fetchFallback(...args);

    const ytApi = (end: string): string => `https://www.youtube.com/youtubei/v1/live_chat${end}`;
    const isReceiving = url.startsWith(ytApi('/get_live_chat'));
    const isSending = url.startsWith(ytApi('/send_message'));
    const action = isReceiving ? 'messageReceive' : 'messageSent';
    if (isReceiving || isSending) {
      const response = JSON.stringify(await (result.clone()).json());
      window.dispatchEvent(new CustomEvent(action, { detail: response }));
    }
    return result;
  };
  window.dispatchEvent(new CustomEvent('chatLoaded', {
    detail: JSON.stringify(window.ytcfg)
  }));
}

const chatLoaded = async (): Promise<void> => {
  if (document.querySelector('.toggleButton')) {
    console.error('HC button detected, not injecting interceptor.');
    return;
  }

  // Register interceptor
  const port: Chat.Port = chrome.runtime.connect();
  port.postMessage({ type: 'registerInterceptor', source: 'ytc', isReplay });

  // Send JSON response to clients
  window.addEventListener('messageReceive', (d) => {
    port.postMessage({
      type: 'processMessageChunk',
      json: (d as CustomEvent).detail
    });
  });

  window.addEventListener('messageSent', (d) => {
    port.postMessage({
      type: 'processSentMessage',
      json: (d as CustomEvent).detail
    });
  });

  window.addEventListener('chatLoaded', (d) => {
    const ytcfg = (JSON.parse((d as CustomEvent).detail) as {
      data_: {
        INNERTUBE_API_KEY: string;
        INNERTUBE_CONTEXT: any;
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    port.onMessage.addListener(async (msg) => {
      function getCookie(name: string): string {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return (parts.pop() ?? '').split(';').shift() ?? '';
        return '';
      }
      if (msg.type !== 'executeChatAction') return;
      const message = msg.message;
      if (message.params == null) return;
      const action = msg.action;
      const apiKey = ytcfg.data_.INNERTUBE_API_KEY;
      console.log('TODO', message, action, apiKey);
      const contextMenuUrl = 'https://www.youtube.com/youtubei/v1/live_chat/get_item_context_menu?params=' +
        `${encodeURIComponent(message.params)}&pbj=1&key=${apiKey}&prettyPrint=false`;
      const context = ytcfg.data_.INNERTUBE_CONTEXT;
      const time = Math.floor(Date.now() / 1000);
      const SAPISID = getCookie('SAPISID');
      const sha = sha1(`${new Date().getTime()} ${SAPISID} https://www.youtube.com`);
      const auth = `SAPISIDHASH ${time}_${sha}`;
      console.log(auth);
      await fetch(contextMenuUrl, {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Authorization: auth
        },
        method: 'POST',
        body: JSON.stringify({ context })
      });
    });
  });

  // Inject interceptor script
  const script = document.createElement('script');
  script.innerHTML = `(${injectedFunction.toString()})();`;
  document.body.appendChild(script);

  // Handle initial data
  const scripts = document.querySelector('body')?.querySelectorAll('script');
  if (!scripts) {
    console.error('Unable to get script elements.');
    return;
  }
  for (const script of Array.from(scripts)) {
    const start = 'window["ytInitialData"] = ';
    const text = script.text;
    if (!text || !text.startsWith(start)) {
      continue;
    }
    const json = text.replace(start, '').slice(0, -1);
    port.postMessage({
      type: 'setInitialData',
      json
    });
    break;
  }

  // Catch YT messages
  window.addEventListener('message', (d) => {
    if (d.data['yt-player-video-progress'] != null) {
      port.postMessage({
        type: 'updatePlayerProgress',
        playerProgress: d.data['yt-player-video-progress']
      });
    }
  });

  // Update dark theme whenever it changes
  let wasDark: boolean | undefined;
  const html = document.documentElement;
  const sendTheme = (): void => {
    const isDark = html.hasAttribute('dark');
    if (isDark === wasDark) return;
    port.postMessage({
      type: 'setTheme',
      dark: isDark
    });
    wasDark = isDark;
  };
  new MutationObserver(sendTheme).observe(html, {
    attributes: true
  });
  sendTheme();

  // Inject mem leak fix script
  const fixLeakScript = document.createElement('script');
  fixLeakScript.innerHTML = `(${fixLeaks.toString()})();`;
  document.body.appendChild(fixLeakScript);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => async () => await chatLoaded());
} else {
  chatLoaded().catch(e => console.error(e));
}
