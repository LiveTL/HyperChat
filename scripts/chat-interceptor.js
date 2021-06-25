import { parseChatResponse } from './chat-parser.js';

const chatLoaded = () => {
  /** Workaround for https://github.com/LiveTL/HyperChat/issues/12 */
  if (chrome.windows) return;

  /** Inject interceptor script */
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

  /** Register interceptor */
  const port = chrome.runtime.connect();
  port.onMessage.addListener((message) => {
    if (message.type === 'interceptorRegistered') {
      const frameInfo = message.frameInfo;
      console.debug('Recieved frameInfo', frameInfo);

      /** Send JSON response to clients */
      window.addEventListener('messageReceive', d => {
        port.postMessage({
          type: 'sendToClients',
          frameInfo,
          payload: parseChatResponse(d.detail)
        });
      });

      /** Handle initial data */
      const scripts = document.querySelector('body').querySelectorAll('script');
      for (const script of scripts) {
        const start = 'window["ytInitialData"] = ';
        const text = script.text;
        if (!text || !text.startsWith(start)) {
          continue;
        }
        const json = text.replace(start, '').slice(0, -1);
        port.postMessage({
          type: 'setInitialData',
          frameInfo,
          payload: parseChatResponse(json, true)
        });
        break;
      }
    }
  });
  port.postMessage({ type: 'registerInterceptor' });
};

/**
 * Load on DOMContentLoaded or later.
 * Does not matter unless run_at is specified in extensions' manifest.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
