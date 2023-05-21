import { fixLeaks } from '../ts/ytc-fix-memleaks';

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

  const currentDomain = (location.protocol + '//' + location.host);
  const ytApi = (end: string): string => `${currentDomain}/youtubei/v1/live_chat${end}`;
  const isReceiving = url.startsWith(ytApi('/get_live_chat'));
  const isSending = url.startsWith(ytApi('/send_message'));
  const action = isReceiving ? 'messageReceive' : 'messageSent';
  if (isReceiving || isSending) {
    const response = JSON.stringify(await (result.clone()).json());
    window.dispatchEvent(new CustomEvent(action, { detail: response }));
  }
  return result;
};
// window.dispatchEvent(new CustomEvent('chatLoaded', {
//   detail: JSON.stringify(window.ytcfg)
// }));
// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('proxyFetchRequest', async (event) => {
  const args = JSON.parse((event as any).detail as string) as [string, any];
  const request = await fetchFallback(...args);
  const response = await request.json();
  window.dispatchEvent(new CustomEvent('proxyFetchResponse', {
    detail: JSON.stringify(response)
  }));
});

fixLeaks();
