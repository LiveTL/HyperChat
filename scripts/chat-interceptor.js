import { parseChatResponse } from './chat-parser.js';

/** Register interceptor */
const port = chrome.runtime.connect();
let frameInfo;
port.onMessage.addListener((message) => {
  if (message.type === 'interceptorRegistered') {
    frameInfo = message.frameInfo;
    console.debug('Recieved frameInfo', frameInfo);
  }
});
port.postMessage({ type: 'registerInterceptor' });

/**
 * Parse and send YTC JSON response.
 *
 * @param {*} response YTC JSON response
 * @param {boolean} [isInitial=false]
 */
const messageReceiveCallback = (response, isInitial = false) => {
  port.postMessage({
    type: 'sendToClients',
    frameInfo,
    payload: parseChatResponse(response, isInitial)
  });
};

// FIXME: VOD chat does not work at the moment.
const chatLoaded = () => {
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
  window.addEventListener('messageReceive', d => messageReceiveCallback(d.detail));
  document.body.appendChild(script);

  // TODO: Initial data
  // const processInitialJson = () => {
  //   const scripts = document.querySelector('body').querySelectorAll('script');
  //   scripts.forEach(script => {
  //     const start = 'window["ytInitialData"] = ';
  //     const text = script.text;
  //     if (!text || !text.startsWith(start)) {
  //       return;
  //     }
  //     const json = text.replace(start, '').slice(0, -1);
  //     messageReceiveCallback(json, true);
  //   });
  // };
  // const iframe = document.querySelector('#optichat');
  // iframe.addEventListener('load', processInitialJson);
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
