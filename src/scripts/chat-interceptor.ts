// import { fixLeaks } from '../ts/ytc-fix-memleaks';
import { frameIsReplay as isReplay, checkInjected } from '../ts/chat-utils';
// import sha1 from 'sha-1';
import { isLiveTL } from '../ts/chat-constants';
import { initInterceptor, processMessageChunk, processSentMessage, setInitialData, updatePlayerProgress, setTheme } from '../ts/messaging';

// function injectedFunction(): void {
//   for (const eventName of ['visibilitychange', 'webkitvisibilitychange', 'blur']) {
//     window.addEventListener(eventName, event => {
//       event.stopImmediatePropagation();
//     }, true);
//   }
//   const fetchFallback = window.fetch;
//   (window as any).fetchFallback = fetchFallback;
//   window.fetch = async (...args) => {
//     const request = args[0] as Request;
//     const url = request.url;
//     const result = await fetchFallback(...args);

//     const ytApi = (end: string): string => `https://www.youtube.com/youtubei/v1/live_chat${end}`;
//     const isReceiving = url.startsWith(ytApi('/get_live_chat'));
//     const isSending = url.startsWith(ytApi('/send_message'));
//     const action = isReceiving ? 'messageReceive' : 'messageSent';
//     if (isReceiving || isSending) {
//       const response = JSON.stringify(await (result.clone()).json());
//       window.dispatchEvent(new CustomEvent(action, { detail: response }));
//     }
//     return result;
//   };
//   // window.dispatchEvent(new CustomEvent('chatLoaded', {
//   //   detail: JSON.stringify(window.ytcfg)
//   // }));
//   // eslint-disable-next-line @typescript-eslint/no-misused-promises
//   window.addEventListener('proxyFetchRequest', async (event) => {
//     const args = JSON.parse((event as any).detail as string) as [string, any];
//     const request = await fetchFallback(...args);
//     const response = await request.json();
//     window.dispatchEvent(new CustomEvent('proxyFetchResponse', {
//       detail: JSON.stringify(response)
//     }));
//   });
// }

const chatLoaded = async (): Promise<void> => {
  const warning = 'HC button detected, not injecting interceptor.';
  if (!isLiveTL && checkInjected(warning)) return;

  // Register interceptor
  // const port: Chat.Port = chrome.runtime.connect();
  // port.postMessage({ type: 'registerInterceptor', source: 'ytc', isReplay });
  initInterceptor('ytc', window.ytcfg, isReplay);

  // Send JSON response to clients
  window.addEventListener('messageReceive', (d) => {
    // port.postMessage({
    //   type: 'processMessageChunk',
    //   json: (d as CustomEvent).detail
    // });
    processMessageChunk((d as CustomEvent).detail);
  });

  window.addEventListener('messageSent', (d) => {
    // port.postMessage({
    //   type: 'processSentMessage',
    //   json: (d as CustomEvent).detail
    // });
    processSentMessage((d as CustomEvent).detail);
  });

  // window.addEventListener('chatLoaded', (d) => {
  //   const ytcfg = (JSON.parse((d as CustomEvent).detail) as {
  //     data_: {
  //       INNERTUBE_API_KEY: string;
  //       INNERTUBE_CONTEXT: any;
  //     };
  //   });
  //   const fetcher = async (...args: any[]): Promise<any> => {
  //     return await new Promise((resolve) => {
  //       const encoded = JSON.stringify(args);
  //       window.addEventListener('proxyFetchResponse', (e) => {
  //         const response = JSON.parse((e as CustomEvent).detail);
  //         resolve(response);
  //       });
  //       window.dispatchEvent(new CustomEvent('proxyFetchRequest', {
  //         detail: encoded
  //       }));
  //     });
  //   };

  //   // eslint-disable-next-line @typescript-eslint/no-misused-promises
  //   port.onMessage.addListener(async (msg) => {
  //     if (msg.type !== 'executeChatAction') return;
  //     const message = msg.message;
  //     if (message.params == null) return;
  //     let success = true;
  //     try {
  //       // const action = msg.action;
  //       const apiKey = ytcfg.data_.INNERTUBE_API_KEY;
  //       const contextMenuUrl = 'https://www.youtube.com/youtubei/v1/live_chat/get_item_context_menu?params=' +
  //         `${encodeURIComponent(message.params)}&pbj=1&key=${apiKey}&prettyPrint=false`;
  //       const baseContext = ytcfg.data_.INNERTUBE_CONTEXT;
  //       function getCookie(name: string): string {
  //         const value = `; ${document.cookie}`;
  //         const parts = value.split(`; ${name}=`);
  //         if (parts.length === 2) return (parts.pop() ?? '').split(';').shift() ?? '';
  //         return '';
  //       }
  //       const time = Math.floor(Date.now() / 1000);
  //       const SAPISID = getCookie('__Secure-3PAPISID');
  //       const sha = sha1(`${time} ${SAPISID} https://www.youtube.com`);
  //       const auth = `SAPISIDHASH ${time}_${sha}`;
  //       const heads = {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Accept: '*/*',
  //           Authorization: auth
  //         },
  //         method: 'POST'
  //       };
  //       const res = await fetcher(contextMenuUrl, {
  //         ...heads,
  //         body: JSON.stringify({ context: baseContext })
  //       });
  //       function parseServiceEndpoint(serviceEndpoint: any, prop: string): { params: string, context: any } {
  //         const { clickTrackingParams, [prop]: { params } } = serviceEndpoint;
  //         const clonedContext = JSON.parse(JSON.stringify(baseContext));
  //         clonedContext.clickTracking = {
  //           clickTrackingParams
  //         };
  //         return {
  //           params,
  //           context: clonedContext
  //         };
  //       }
  //       if (msg.action === ChatUserActions.BLOCK) {
  //         const { params, context } = parseServiceEndpoint(
  //           res.liveChatItemContextMenuSupportedRenderers.menuRenderer.items[1]
  //             .menuNavigationItemRenderer.navigationEndpoint.confirmDialogEndpoint
  //             .content.confirmDialogRenderer.confirmButton.buttonRenderer.serviceEndpoint,
  //           'moderateLiveChatEndpoint'
  //         );
  //         await fetcher(`https://www.youtube.com/youtubei/v1/live_chat/moderate?key=${apiKey}&prettyPrint=false`, {
  //           ...heads,
  //           body: JSON.stringify({
  //             params,
  //             context
  //           })
  //         });
  //       } else if (msg.action === ChatUserActions.REPORT_USER) {
  //         const { params, context } = parseServiceEndpoint(
  //           res.liveChatItemContextMenuSupportedRenderers.menuRenderer.items[0].menuServiceItemRenderer.serviceEndpoint,
  //           'getReportFormEndpoint'
  //         );
  //         const modal = await fetcher(`https://www.youtube.com/youtubei/v1/flag/get_form?key=${apiKey}&prettyPrint=false`, {
  //           ...heads,
  //           body: JSON.stringify({
  //             params,
  //             context
  //           })
  //         });
  //         const index = chatReportUserOptions.findIndex(d => d.value === msg.reportOption);
  //         const options = modal.actions[0].openPopupAction.popup.reportFormModalRenderer.optionsSupportedRenderers.optionsRenderer.items;
  //         const submitEndpoint = options[index].optionSelectableItemRenderer.submitEndpoint;
  //         const clickTrackingParams = submitEndpoint.clickTrackingParams;
  //         const flagAction = submitEndpoint.flagEndpoint.flagAction;
  //         context.clickTracking = {
  //           clickTrackingParams
  //         };
  //         await fetcher(`https://www.youtube.com/youtubei/v1/flag/flag?key=${apiKey}&prettyPrint=false`, {
  //           ...heads,
  //           body: JSON.stringify({
  //             action: flagAction,
  //             context
  //           })
  //         });
  //       }
  //     } catch (e) {
  //       console.debug('Error executing chat action', e);
  //       success = false;
  //     }
  //     port.postMessage({
  //       type: 'chatUserActionResponse',
  //       action: msg.action,
  //       message,
  //       success
  //     });
  //   });
  // });

  // Inject interceptor script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('scripts/interceptor.js');
  // script.innerHTML = `(${injectedFunction.toString()})();`;
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
    // port.postMessage({
    //   type: 'setInitialData',
    //   json
    // });
    setInitialData(json);
    break;
  }

  // Catch YT messages
  window.addEventListener('message', (d) => {
    if (d.data['yt-player-video-progress'] != null) {
      // port.postMessage({
      //   type: 'updatePlayerProgress',
      //   playerProgress: d.data['yt-player-video-progress'],
      //   isFromYt: true
      // });
      updatePlayerProgress(d.data['yt-player-video-progress'], true);
    }
  });

  // Update dark theme whenever it changes
  let wasDark: boolean | undefined;
  const html = document.documentElement;
  const sendTheme = (): void => {
    const isDark = html.hasAttribute('dark');
    if (isDark === wasDark) return;
    // port.postMessage({
    //   type: 'setTheme',
    //   dark: isDark
    // });
    setTheme(isDark);
    wasDark = isDark;
  };
  new MutationObserver(sendTheme).observe(html, {
    attributes: true
  });
  sendTheme();

  // // Inject mem leak fix script
  // const fixLeakScript = document.createElement('script');
  // fixLeakScript.innerHTML = `(${fixLeaks.toString()})();`;
  // document.body.appendChild(fixLeakScript);
};

if (isLiveTL) {
  chatLoaded().catch(console.error);
} else {
  setTimeout(() => {
    chatLoaded().catch(console.error);
  }, 500);
}
