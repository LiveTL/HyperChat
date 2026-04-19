import { fixLeaks } from '../ts/ytc-fix-memleaks';

const currentDomain = (location.protocol + '//' + location.host);

// Capture YouTube's Innertube headers from real page requests and reuse them for
// our proxied requests. YT keeps changing which headers gate privileged actions.
const innertubeHeaderAllowlist = new Set([
  'x-goog-authuser',
  'x-goog-visitor-id',
  'x-origin',
  'x-youtube-bootstrap-logged-in',
  'x-youtube-client-name',
  'x-youtube-client-version',
  'x-browser-validation',
  'x-browser-channel',
  'x-browser-year',
  'x-browser-copyright'
]);
let lastInnertubeHeaders: Record<string, string> = {};

const captureInnertubeHeaders = (headers: Headers): void => {
  const captured: Record<string, string> = {};
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (!innertubeHeaderAllowlist.has(key)) return;
    captured[key] = value;
  });
  if (Object.keys(captured).length > 0) {
    lastInnertubeHeaders = { ...lastInnertubeHeaders, ...captured };
  }
};

const isInnertubeUrl = (url: string): boolean => url.startsWith(`${currentDomain}/youtubei/`);

for (const eventName of ['visibilitychange', 'webkitvisibilitychange', 'blur']) {
  window.addEventListener(eventName, event => {
    event.stopImmediatePropagation();
  }, true);
}

const fetchFallback = window.fetch;
(window as any).fetchFallback = fetchFallback;
window.fetch = async (...args) => {
  const input = args[0] as unknown;
  const url = typeof input === 'string' ? input : (input as Request).url;
  const init = (args.length > 1 ? args[1] : undefined) as RequestInit | undefined;

  try {
    if (typeof input !== 'string') {
      captureInnertubeHeaders((input as Request).headers);
    } else if (init?.headers != null) {
      captureInnertubeHeaders(new Headers(init.headers as any));
    }
  } catch {
    // Best-effort only.
  }

  const result = await (fetchFallback as any)(...args);

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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('proxyFetchRequest', async (event) => {
  const payload = JSON.parse((event as any).detail as string) as {
    id: string;
    args: [RequestInfo, RequestInit?];
  };
  try {
    const [input, init] = payload.args;
    const url = typeof input === 'string' ? input : input.url;
    let mergedInit = init;
    if (isInnertubeUrl(url)) {
      const headers = new Headers(init?.headers as any);
      for (const [k, v] of Object.entries(lastInnertubeHeaders)) {
        if (!headers.has(k)) headers.set(k, v);
      }
      mergedInit = {
        ...init,
        headers
      };
    }

    const request = await fetchFallback(input, mergedInit);
    const response = await request.json();
    window.dispatchEvent(new CustomEvent('proxyFetchResponse', {
      detail: JSON.stringify({
        id: payload.id,
        response
      })
    }));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('proxyFetchResponse', {
      detail: JSON.stringify({
        id: payload.id,
        error: String(error)
      })
    }));
  }
});

fixLeaks();
