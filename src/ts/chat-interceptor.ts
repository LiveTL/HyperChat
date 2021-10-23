import { fixLeaks } from './ytc-fix-memleaks';
import { frameIsReplay as isReplay } from './chat-utils';

const chatLoaded = async (): Promise<void> => {
  if (document.querySelector('.toggleButton')) {
    console.error('HC button detected, not injecting interceptor.');
    return;
  }

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
  const port: Chat.Port = chrome.runtime.connect();
  port.postMessage({ type: 'registerInterceptor', isReplay });

  // Send JSON response to clients
  window.addEventListener('messageReceive', (d) => {
    port.postMessage({
      type: 'processJson',
      // @ts-expect-error TS doesn't like CustomEvent
      json: d.detail
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
