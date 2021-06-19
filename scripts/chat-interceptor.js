import { parseChatResponse } from './parse-chat.js';

const connectedPorts = [];

export const messageReceiveCallback = (response, isInitial = false) => {
  connectedPorts.forEach((port) => {
    port.postMessage(parseChatResponse(response, isInitial));
  });
};

const chatLoaded = () => {
  const script = document.createElement('script');
  script.innerHTML = `
    for (event_name of ["visibilitychange", "webkitvisibilitychange", "blur"]) {
      window.addEventListener(event_name, event => {
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

  // eslint-disable-next-line no-undef
  chrome.runtime.onConnect.addListener((port) => {
    connectedPorts.push(port);
  });

  window.addEventListener('messageReceive', d => messageReceiveCallback(d.detail));
  document.body.appendChild(script);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
