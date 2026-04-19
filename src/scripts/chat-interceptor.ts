import { fixLeaks } from '../ts/ytc-fix-memleaks';

const currentDomain = (location.protocol + '//' + location.host);

// Capture YouTube's Innertube headers from real page requests and reuse them for
// our proxied requests. YT keeps changing which headers gate privileged actions.
const innertubeHeaderAllowlist = new Set([
  'authorization',
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

// For privileged actions, the serialized `ytcfg.data_.INNERTUBE_CONTEXT` that our extension code sees
// can differ from the context YT actually uses for real page requests (notably `adSignalsInfo` and
// `clickTracking`). When proxying Innertube calls from the page, rewrite the request payload to use
// the real page-side `ytcfg.get('INNERTUBE_CONTEXT')` value and preserve only intentional clickTracking
// overrides.
const getPageInnertubeContext = (): any | null => {
  const ytcfgAny = (window as any).ytcfg as any;
  try {
    if (ytcfgAny?.get instanceof Function) {
      return ytcfgAny.get('INNERTUBE_CONTEXT');
    }
  } catch {
    // Best-effort only.
  }
  return ytcfgAny?.data_?.INNERTUBE_CONTEXT ?? null;
};

const gzipUtf8 = async (text: string): Promise<Uint8Array> => {
  const cs = new (window as any).CompressionStream('gzip') as CompressionStream;
  const writer = cs.writable.getWriter();
  await writer.write(new TextEncoder().encode(text));
  await writer.close();
  const ab = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(ab);
};

const normalizeInnertubeInit = async (
  url: string,
  init: RequestInit | undefined
): Promise<RequestInit | undefined> => {
  if (!isInnertubeUrl(url)) return init;

  const next: RequestInit = { ...(init ?? {}) };
  if (next.mode == null) next.mode = 'same-origin';

  const headers = new Headers(next.headers as any);
  next.headers = headers;

  if (typeof next.body === 'string') {
    try {
      const parsed = JSON.parse(next.body) as any;
      if (parsed?.context != null && typeof parsed.context === 'object') {
        const pageContext = getPageInnertubeContext();
        if (pageContext != null) {
          const overrideClickTracking = parsed.context?.clickTracking;
          parsed.context = pageContext;
          if (overrideClickTracking?.clickTrackingParams != null) {
            parsed.context = { ...parsed.context, clickTracking: overrideClickTracking };
          }
          next.body = JSON.stringify(parsed);
        }
      }
    } catch {
      // Best-effort only.
    }
  }

  // Match YT's native transport: gzip JSON POST bodies when possible.
  if (
    typeof next.body === 'string' &&
    headers.get('content-encoding') == null &&
    (headers.get('content-type') ?? '').includes('application/json') &&
    typeof (window as any).CompressionStream === 'function'
  ) {
    headers.set('content-encoding', 'gzip');
    next.body = await gzipUtf8(next.body);
  }

  return next;
};

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
    let mergedInit: RequestInit | undefined = init;
    let hcAction: string | null = null;
    if (isInnertubeUrl(url)) {
      const headers = new Headers(init?.headers as any);
      hcAction = headers.get('x-hc-action');
      if (hcAction != null) headers.delete('x-hc-action');
      for (const [k, v] of Object.entries(lastInnertubeHeaders)) {
        if (!headers.has(k)) headers.set(k, v);
      }
      mergedInit = {
        ...init,
        headers
      };
    }
    mergedInit = await normalizeInnertubeInit(url, mergedInit);

    if (hcAction === 'delete' && isInnertubeUrl(url)) {
      try {
        const bodyStr = typeof mergedInit?.body === 'string' ? mergedInit?.body : '';
        const parsed = bodyStr ? JSON.parse(bodyStr) : null;
        console.debug('[hc] delete: proxy request', {
          url,
          mode: (mergedInit as any)?.mode ?? null,
          hasBody: bodyStr.length > 0,
          bodyKeys: parsed != null && typeof parsed === 'object' ? Object.keys(parsed) : null,
          contextKeys: parsed?.context != null && typeof parsed.context === 'object' ? Object.keys(parsed.context) : null
        });
      } catch (e) {
        console.debug('[hc] delete: proxy request (unparsed)', { url, err: String(e) });
      }
    }

    const request = await fetchFallback(input, mergedInit);
    const response = await request.json();
    if (hcAction === 'delete' && isInnertubeUrl(url)) {
      console.debug('[hc] delete: proxy response', {
        url,
        ok: request.ok,
        status: request.status,
        keys: response != null && typeof response === 'object' ? Object.keys(response) : null,
        hasError: (response as any)?.error != null
      });
    }
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
