import { fixLeaks } from '../ts/ytc-fix-memleaks';
import { frameIsReplay as isReplay, checkInjected } from '../ts/chat-utils';
import { chatReportUserOptions, ChatUserActions, isLiveTL } from '../ts/chat-constants';
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
    const result = await (fetchFallback as any)(...args);

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
  window.dispatchEvent(new CustomEvent('chatLoaded', {
    detail: JSON.stringify(window.ytcfg)
  }));
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  window.addEventListener('proxyFetchRequest', async (event) => {
    const payload = JSON.parse((event as any).detail as string) as {
      id: string;
      args: [RequestInfo, RequestInit?];
    };
    try {
      const request = await (fetchFallback as any)(...payload.args);
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
}

const chatLoaded = async (): Promise<void> => {
  const warning = 'HC button detected, not injecting interceptor.';
  if (!isLiveTL && checkInjected(warning)) return;

  // Register interceptor
  const port: Chat.Port = chrome.runtime.connect();
  port.postMessage({ type: 'registerInterceptor', source: 'ytc', isReplay: isReplay() });

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
    const fetcher = async (...args: any[]): Promise<any> => {
      return await new Promise((resolve, reject) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const encoded = JSON.stringify({ id, args });
        const onFetchResponse = (e: Event): void => {
          const response = JSON.parse((e as CustomEvent).detail) as {
            id: string;
            response?: any;
            error?: string;
          };
          if (response.id !== id) return;
          window.removeEventListener('proxyFetchResponse', onFetchResponse);
          if (response.error != null) {
            reject(new Error(response.error));
            return;
          }
          resolve(response.response);
        };
        window.addEventListener('proxyFetchResponse', onFetchResponse);
        window.dispatchEvent(new CustomEvent('proxyFetchRequest', {
          detail: encoded
        }));
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    port.onMessage.addListener(async (msg) => {
      const getCookie = (name: string): string => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return (parts.pop() ?? '').split(';').shift() ?? '';
        return '';
      };

      if (msg.type !== 'executeChatAction') return;
      const message = msg.message;
      const debugAction = msg.action === ChatUserActions.DELETE_MESSAGE;
      let success = true;
      if (message.params == null) {
        success = false;
      }
      try {
        if (message.params == null) {
          throw new Error('Missing context menu params for message');
        }
        const currentDomain = (location.protocol + '//' + location.host);
        const apiKey = ytcfg.data_.INNERTUBE_API_KEY;
        const contextMenuUrl = `${currentDomain}/youtubei/v1/live_chat/get_item_context_menu?params=` +
          `${encodeURIComponent(message.params)}&pbj=1&key=${apiKey}&prettyPrint=false`;
        const baseContext = ytcfg.data_.INNERTUBE_CONTEXT;
        // Do not override Innertube headers like X-Goog-Visitor-Id here. Those can differ from
        // ytcfg.context.client.visitorData in subtle ways and cause YT to treat the request as logged out.
        // Instead, let the page-side proxy merge the latest headers from real YT requests.
        const time = Math.floor(Date.now() / 1000);
        const sapisid = getCookie('__Secure-3PAPISID') || getCookie('SAPISID');
        const auth = sapisid ? `SAPISIDHASH ${time}_${sha1(`${time} ${sapisid} ${currentDomain}`)}` : null;
        const authuser = (ytcfg as any)?.data_?.SESSION_INDEX;
        const visitorId = (ytcfg as any)?.data_?.VISITOR_DATA ?? baseContext?.client?.visitorData;
        const clientName = (ytcfg as any)?.data_?.INNERTUBE_CLIENT_NAME;
        const clientVersion = (ytcfg as any)?.data_?.INNERTUBE_CLIENT_VERSION;
        const heads = {
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            ...(authuser != null ? { 'X-Goog-AuthUser': String(authuser) } : {}),
            ...(visitorId != null ? { 'X-Goog-Visitor-Id': String(visitorId) } : {}),
            ...(clientName != null ? { 'X-Youtube-Client-Name': String(clientName) } : {}),
            ...(clientVersion != null ? { 'X-Youtube-Client-Version': String(clientVersion) } : {}),
            'X-Origin': currentDomain,
            ...(auth != null ? { Authorization: auth } : {})
          },
          method: 'POST' as const,
          mode: 'same-origin' as const
        };
        const contextMenuContext = JSON.parse(JSON.stringify(baseContext));
        if (debugAction) {
          console.debug('[hc] delete: get_item_context_menu', {
            url: contextMenuUrl,
            messageId: message.messageId,
            paramsPrefix: message.params.slice(0, 24)
          });
        }
        const res = await fetcher(contextMenuUrl, {
          ...heads,
          body: JSON.stringify({ context: contextMenuContext })
        });
        if (debugAction) {
          const iconTypes: string[] = [];
          try {
            const json = JSON.stringify(res);
            // Very rough: just to quickly see if the response contains DELETE menu items at all.
            if (json.includes('"iconType":"DELETE"')) iconTypes.push('DELETE');
            if (json.includes('"iconType":"BLOCK"')) iconTypes.push('BLOCK');
            if (json.includes('"getReportFormEndpoint"')) iconTypes.push('REPORT');
          } catch {}
          console.debug('[hc] delete: context menu response', {
            hasResponse: res != null,
            keys: res != null && typeof res === 'object' ? Object.keys(res) : null,
            hints: iconTypes
          });
        }
        function findServiceEndpoint(root: any, prop: string): any | null {
          const queue = [root];
          const visited = new Set<any>();
          while (queue.length > 0) {
            const current = queue.shift();
            if (current == null || typeof current !== 'object' || visited.has(current)) continue;
            visited.add(current);
            if (typeof current?.[prop]?.params === 'string') {
              return current;
            }
            for (const value of Object.values(current)) {
              if (value != null && typeof value === 'object') {
                queue.push(value);
              }
            }
          }
          return null;
        }
        function parseServiceEndpoint(serviceEndpoint: any, prop: string): { params: string, context: any } {
          if (typeof serviceEndpoint?.[prop]?.params !== 'string') {
            throw new Error(`Missing service endpoint params for ${prop}`);
          }
          const { clickTrackingParams, [prop]: { params } } = serviceEndpoint;
          const clonedContext = JSON.parse(JSON.stringify(baseContext));
          if (clickTrackingParams != null) {
            clonedContext.clickTracking = {
              clickTrackingParams
            };
          }
          return {
            params,
            context: clonedContext
          };
        }
        function findDeleteMessageEndpoint(root: any): any | null {
          const queue = [root];
          const visited = new Set<any>();
          const candidates: Array<{ iconType?: string, label?: string, endpoint: any }> = [];
          while (queue.length > 0) {
            const current = queue.shift();
            if (current == null || typeof current !== 'object' || visited.has(current)) continue;
            visited.add(current);
            const menu = current?.menuServiceItemRenderer;
            const iconType = menu?.icon?.iconType;
            const endpoint = menu?.serviceEndpoint;
            const label = (
              Array.isArray(menu?.text?.runs)
                ? menu.text.runs.map((r: any) => r?.text).filter(Boolean).join('')
                : menu?.text?.simpleText
            ) as string | undefined;
            // Prefer stable identifiers (DELETE icon + moderate endpoint) over localized label text.
            if (typeof endpoint?.moderateLiveChatEndpoint?.params === 'string') {
              candidates.push({ iconType, label, endpoint });
            }
            for (const value of Object.values(current)) {
              if (value != null && typeof value === 'object') {
                queue.push(value);
              }
            }
          }
          for (const c of candidates) {
            if (c.iconType === 'DELETE') return c.endpoint;
          }
          for (const c of candidates) {
            const l = (c.label ?? '').toLowerCase();
            if (l.includes('remove') || l.includes('delete') || l.includes('retract') || l.includes('unsend')) {
              return c.endpoint;
            }
          }
          if (candidates.length === 1) return candidates[0].endpoint;
          return null;
        }
        if (msg.action === ChatUserActions.BLOCK) {
          const serviceEndpoint = findServiceEndpoint(res, 'moderateLiveChatEndpoint');
          if (serviceEndpoint == null) {
            throw new Error('Could not find moderate endpoint in context menu');
          }
          const { params, context } = parseServiceEndpoint(serviceEndpoint, 'moderateLiveChatEndpoint');
          const moderationResponse = await fetcher(`${currentDomain}/youtubei/v1/live_chat/moderate?key=${apiKey}&prettyPrint=false`, {
            ...heads,
            body: JSON.stringify({
              params,
              context
            })
          });
          if (moderationResponse?.error != null || moderationResponse?.success === false) {
            throw new Error('Moderation request failed');
          }
        } else if (msg.action === ChatUserActions.DELETE_MESSAGE) {
          const serviceEndpoint = findDeleteMessageEndpoint(res);
          if (serviceEndpoint == null) {
            throw new Error('Could not find delete endpoint in context menu');
          }
          const { params, context } = parseServiceEndpoint(serviceEndpoint, 'moderateLiveChatEndpoint');
          if (debugAction) {
            console.debug('[hc] delete: moderate', {
              paramsPrefix: params.slice(0, 24)
            });
          }
          const moderationResponse = await fetcher(`${currentDomain}/youtubei/v1/live_chat/moderate?key=${apiKey}&prettyPrint=false`, {
            ...heads,
            body: JSON.stringify({
              params,
              context
            })
          });
          if (debugAction) {
            console.debug('[hc] delete: moderate response', {
              keys: moderationResponse != null && typeof moderationResponse === 'object'
                ? Object.keys(moderationResponse)
                : null,
              hasError: moderationResponse?.error != null,
              success: moderationResponse?.success
            });
          }
          if (moderationResponse?.error != null || moderationResponse?.success === false) {
            throw new Error('Moderation request failed');
          }
        } else if (msg.action === ChatUserActions.REPORT_USER) {
          const apiKey = ytcfg.data_.INNERTUBE_API_KEY;
          const serviceEndpoint = findServiceEndpoint(res, 'getReportFormEndpoint');
          if (serviceEndpoint == null) {
            throw new Error('Could not find report endpoint in context menu');
          }
          const { params, context } = parseServiceEndpoint(serviceEndpoint, 'getReportFormEndpoint');
          const modal = await fetcher(`${currentDomain}/youtubei/v1/flag/get_form?key=${apiKey}&prettyPrint=false`, {
            ...heads,
            body: JSON.stringify({
              params,
              context
            })
          });
          const options = modal?.actions?.[0]
            ?.openPopupAction?.popup?.reportFormModalRenderer
            ?.optionsSupportedRenderers?.optionsRenderer?.items;
          if (!Array.isArray(options) || options.length < 1) {
            throw new Error('Report options are missing');
          }
          const reportIndex = chatReportUserOptions.findIndex(d => d.value === msg.reportOption);
          const index = reportIndex >= 0 && reportIndex < options.length ? reportIndex : 0;
          const submitEndpoint = options[index]?.optionSelectableItemRenderer?.submitEndpoint;
          const clickTrackingParams = submitEndpoint?.clickTrackingParams;
          const flagAction = submitEndpoint?.flagEndpoint?.flagAction;
          if (flagAction == null) {
            throw new Error('Report submit endpoint is missing');
          }
          if (clickTrackingParams != null) {
            context.clickTracking = {
              clickTrackingParams
            };
          }
          const flagResponse = await fetcher(`${currentDomain}/youtubei/v1/flag/flag?key=${apiKey}&prettyPrint=false`, {
            ...heads,
            body: JSON.stringify({
              action: flagAction,
              context
            })
          });
          if (flagResponse?.error != null || flagResponse?.success === false) {
            throw new Error('Report request failed');
          }
        }
      } catch (e) {
        console.debug('Error executing chat action', e);
        success = false;
      }
      port.postMessage({
        type: 'chatUserActionResponse',
        action: msg.action,
        message,
        success
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
        playerProgress: d.data['yt-player-video-progress'],
        isFromYt: true
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

if (isLiveTL) {
  chatLoaded().catch(console.error);
} else {
  setTimeout(() => {
    chatLoaded().catch(console.error);
  }, 500);
}
