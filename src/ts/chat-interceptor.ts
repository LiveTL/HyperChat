import { fixLeaks } from './ytc-fix-memleaks';

const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

const chatLoaded = async () => {
  // Inject interceptor script
  const script = document.createElement('script');
  script.innerHTML = `
    for (eventName of ["visibilitychange", "webkitvisibilitychange", "blur"]) {
      window.addEventListener(eventName, event => {
        event.stopImmediatePropagation();
      }, true);
    }
    window.fetchFallback = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0].url;
      const result = await window.fetchFallback(...args);
      if (url.startsWith(
        'https://www.youtube.com/youtubei/v1/live_chat/get_live_chat')
      ) {
        const response = JSON.stringify(await (await result.clone()).json());
        window.dispatchEvent(new CustomEvent('messageReceive', { detail: response }));
      }
      return result;
    };
  `;
  document.body.appendChild(script);

  // Register interceptor
  const port = chrome.runtime.connect();
  port.postMessage({ type: 'registerInterceptor' });

  // Send JSON response to clients
  window.addEventListener('messageReceive', (d) => {
    port.postMessage({
      type: 'sendToClients',
      // @ts-expect-error TS doesn't like CustomEvent
      response: d.detail,
      isReplay
    });
  });

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
      response: json,
      isReplay
    });
    break;
  }

  // Catch YT messages
  window.addEventListener('message', (d) => {
    if (d.data['yt-player-video-progress'] != null) {
      port.postMessage({
        type: 'sendPlayerProgress',
        playerProgress: d.data['yt-player-video-progress']
      });
    }
  });

  const html = document.documentElement;
  const sendTheme = () => {
    const isDark = html.hasAttribute('dark');
    port.postMessage({
      type: 'setTheme',
      dark: isDark
    });
  };
  new MutationObserver(sendTheme).observe(html, {
    attributes: true
  });
  sendTheme();

  const fixLeakScript = document.createElement('script');
  fixLeakScript.innerHTML = `(${fixLeaks.toString()})();`;
  document.body.appendChild(fixLeakScript);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
