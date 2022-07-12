import type { Unsubscriber } from './queue';
import { ytcQueue } from './queue';
// import { isValidFrameInfo } from './chat-utils';
import sha1 from 'sha-1';
import { chatReportUserOptions, ChatUserActions, ChatReportUserOptions } from '../ts/chat-constants';

// const interceptors: Chat.Interceptors[] = [];
const interceptor: Chat.Interceptor = { clients: [] };

const isYtcInterceptor = (i: Chat.Interceptors): i is Chat.YtcInterceptor =>
  i.source === 'ytc';

interface YtCfg {
  data_: {
    INNERTUBE_API_KEY: string;
    INNERTUBE_CONTEXT: any;
  };
}

// const getPortFrameInfo = (port: Chat.Port): Chat.UncheckedFrameInfo => {
//   return {
//     tabId: port.sender?.tab?.id,
//     frameId: port.sender?.frameId
//   };
// };

/**
 * Returns true if both FrameInfos are the same frame.
 */
// const compareFrameInfo = (a: Chat.FrameInfo, b: Chat.FrameInfo): boolean => {
//   return a.tabId === b.tabId && a.frameId === b.frameId;
// };

/**
 * Returns the index of the interceptor with a matching FrameInfo.
 * Will return `-1` if no interceptor is found.
 */
// const findInterceptorIndex = (frameInfo: Chat.FrameInfo): number => {
//   return interceptors.findIndex(
//     (i) => compareFrameInfo(i.frameInfo, frameInfo)
//   );
// };

/**
 * Finds and returns the interceptor with a matching FrameInfo.
 * Will return `undefined` if no interceptor is found.
 */
// const findInterceptor = (frameInfo: Chat.FrameInfo, debugObject?: unknown): Chat.Interceptor | undefined => {
//   const i = findInterceptorIndex(frameInfo);
//   if (i < 0) {
//     console.error('Interceptor not registered', debugObject);
//     return;
//   }
//   return interceptors[i];
// };

/**
 * Finds and returns the interceptor based on the given Port.
 * Should only be used for messages that are expected from interceptors.
 * Will return `undefined` if no interceptor is found.
 */
// const findInterceptorFromPort = (
//   port: Chat.Port,
//   errorObject?: Record<string, unknown>
// ): Chat.Interceptor | undefined => {
//   const frameInfo = getPortFrameInfo(port);
//   if (!isValidFrameInfo(frameInfo, port)) return;
//   return findInterceptor(
//     frameInfo,
//     { interceptors, port, ...errorObject }
//   );
// };

// const findInterceptorFromClient = (
//   client: Chat.Port
// ): Chat.Interceptor | undefined => {
//   return interceptors.find((interceptor) => {
//     for (const c of interceptor.clients) {
//       if (c.name === client.name) return true;
//     }
//     return false;
//   });
// };

/**
 * If both port and clients are empty, removes interceptor from array.
 * Also runs the queue unsubscribe function.
 */
// const cleanupInterceptor = (i: number): void => {
//   const interceptor = interceptors[i];
//   if (!interceptor.port && interceptor.clients.length < 1) {
//     console.debug('Removing empty interceptor', { interceptor, interceptors });
//     if (isYtcInterceptor(interceptor)) {
//       interceptor.queue.cleanUp();
//       interceptor.queueUnsub?.();
//     }
//     interceptors.splice(i, 1);
//   }
// };

/**
 * Register an interceptor into the `interceptors` array.
 * If an interceptor with the same FrameInfo already exists, its port will be
 * replaced with the given port instead.
 */
// const registerInterceptor = (
//   port: Chat.Port,
//   source: Chat.InterceptorSource,
//   isReplay?: boolean
// ): void => {
//   const frameInfo = getPortFrameInfo(port);
//   if (!isValidFrameInfo(frameInfo, port)) return;

//   // Unregister interceptor when port disconnects
//   port.onDisconnect.addListener(() => {
//     const i = findInterceptorIndex(frameInfo);
//     if (i < 0) {
//       console.error(
//         'Failed to unregister interceptor',
//         { port, interceptors }
//       );
//       return;
//     }
//     interceptors[i].port = undefined;
//     cleanupInterceptor(i);
//     console.debug('Interceptor unregistered', { port, interceptors });
//   });

//   // Replace port if interceptor already exists
//   const i = findInterceptorIndex(frameInfo);
//   if (i >= 0) {
//     console.debug(
//       'Replacing existing interceptor port',
//       { oldPort: interceptors[i].port, port }
//     );
//     interceptors[i].port = port;
//     return;
//   }

//   // Add interceptor to array
//   const interceptor = {
//     frameInfo,
//     port,
//     clients: []
//   };
//   if (source === 'ytc') {
//     const queue = ytcQueue(isReplay);
//     let queueUnsub: Unsubscriber | undefined;
//     const ytcInterceptor: Chat.YtcInterceptor = {
//       ...interceptor,
//       source: 'ytc',
//       dark: false,
//       queue,
//       queueUnsub
//     };
//     interceptors.push(ytcInterceptor);
//     ytcInterceptor.queueUnsub = queue.latestAction.subscribe((latestAction) => {
//       const interceptor = findInterceptorFromPort(port, { latestAction });
//       if (!interceptor || !latestAction) return;
//       interceptor.clients.forEach((port) => port.postMessage(latestAction));
//     });
//   } else {
//     interceptors.push({ ...interceptor, source });
//   }
//   console.debug('New interceptor registered', { port, interceptors });
// };

/**
 * Register a client to the interceptor with the matching FrameInfo.
 */
const registerClient = (
  port: Chat.Port,
  // frameInfo: Chat.FrameInfo,
  getInitialData = false
): void => {
  // const interceptor = findInterceptor(
  //   frameInfo,
  //   { interceptors, port, frameInfo }
  // );
  // if (!interceptor) {
  //   port.postMessage(
  //     {
  //       type: 'registerClientResponse',
  //       success: false,
  //       failReason: 'Interceptor not found'
  //     }
  //   );
  //   return;
  // }

  if (interceptor.clients.some((client) => client.name === port.name)) {
    console.debug(
      'Client already registered. Not registering',
      { interceptor, port }
    );
    port.postMessage(
      {
        type: 'registerClientResponse',
        success: false,
        failReason: 'Client already registered'
      }
    );
    return;
  }

  // Assign pseudo-unique name
  port.name = `${Date.now()}${Math.random()}`;

  // Unregister client when port disconnects
  port.onDisconnect.addListener(() => {
    const i = interceptor.clients.findIndex(
      (clientPort) => clientPort.name === port.name
    );
    if (i < 0) {
      console.error('Failed to unregister client', { port, interceptor });
      return;
    }
    interceptor.clients.splice(i, 1);
    console.debug('Unregister client successful', { port, interceptor });

    // cleanupInterceptor(findInterceptorIndex(frameInfo));
  });

  // Add client to array
  interceptor.clients.push(port);
  console.debug('Register client successful', { port, interceptor });
  port.postMessage(
    {
      type: 'registerClientResponse',
      success: true
    }
  );

  if (getInitialData && isYtcInterceptor(interceptor)) {
    const selfChannel = interceptor.queue.selfChannel.get();
    const payload: Chat.InitialData = {
      type: 'initialData',
      initialData: interceptor.queue.getInitialData(),
      selfChannel: selfChannel != null
        ? {
            name: selfChannel.authorName?.simpleText ?? '',
            channelId: selfChannel.authorExternalChannelId ?? ''
          }
        : null
    };
    port.postMessage(payload);
    console.debug('Sent initial data', { port, interceptor, payload });
  }
};

/**
 * Parses the given YTC json response, and adds it to the queue of the
 * interceptor that sent it.
 */
export const processMessageChunk = (message: Chat.JsonMsg): void => {
  const json = message.json;
  // const interceptor = findInterceptorFromPort(port, { message });
  if (!isYtcInterceptor(interceptor)) return;

  if (interceptor.clients.length < 1) {
    console.debug('No clients', { interceptor, json });
    return;
  }

  interceptor.queue.addJsonToQueue(json, false, interceptor);
};

/**
 * Parses a sent message and adds a fake message entry.
 */
export const processSentMessage = (message: Chat.JsonMsg): void => {
  const json = message.json;
  // const interceptor = findInterceptorFromPort(port, { message });
  if (!isYtcInterceptor(interceptor)) return;

  const fakeJson: Ytc.SentChatItemAction = JSON.parse(json);
  const fakeChunk: Ytc.RawResponse = {
    continuationContents: {
      liveChatContinuation: {
        continuations: [{
          timedContinuationData: {
            timeoutMs: 0
          }
        }],
        actions: fakeJson.actions
      }
    }
  };
  interceptor.queue.addJsonToQueue(JSON.stringify(
    fakeChunk
  ), false, interceptor, true);
};

/**
 * Parses and sets initial message data and metadata.
 */
export const setInitialData = (json: string): void => {
  // const json = message.json;
  // const interceptor = findInterceptorFromPort(port, { message });
  if (!isYtcInterceptor(interceptor)) return;

  interceptor.queue.addJsonToQueue(json, true, interceptor);

  const parsedJson = JSON.parse(json);

  const actionPanel = (parsedJson?.continuationContents?.liveChatContinuation ||
    parsedJson?.contents?.liveChatRenderer)
    ?.actionPanel;

  const user = actionPanel?.liveChatMessageInputRenderer
    ?.sendButton?.buttonRenderer?.serviceEndpoint
    ?.sendLiveChatMessageEndpoint?.actions[0]
    ?.addLiveChatTextMessageFromTemplateAction?.template
    ?.liveChatTextMessageRenderer ?? {
    authorName: {
      simpleText: parsedJson.continuationContents.liveChatContinuation.viewerName
    }
  };

  interceptor.queue.selfChannel.set(user);
};

/**
 * Updates the player progress of the queue of the interceptor.
 */
export const updatePlayerProgress = (playerProgress: number, isFromYt?: boolean): void => {
  // const interceptor = findInterceptorFromPort(port, { playerProgress });
  if (!isYtcInterceptor(interceptor)) return;

  interceptor.queue.updatePlayerProgress(playerProgress, isFromYt);
};

/**
 * Sets the theme of the interceptor, and sends the new theme to any currently
 * registered clients.
 */
export const setTheme = (dark: boolean): void => {
  // const interceptor = findInterceptorFromPort(port, { dark });
  if (!isYtcInterceptor(interceptor)) return;

  interceptor.dark = dark;
  interceptor.clients.forEach(
    (port) => port.postMessage({ type: 'themeUpdate', dark })
  );
  console.debug(`Set dark theme to ${dark.toString()}`);
};

/**
 * Returns a message with the theme of the interceptor with a matching
 * FrameInfo.
 */
const getTheme = (port: Chat.Port): void => {
  // const interceptor = findInterceptor(
  //   frameInfo,
  //   { interceptors, port, frameInfo }
  // );
  if (!isYtcInterceptor(interceptor)) return;

  port.postMessage({ type: 'themeUpdate', dark: interceptor.dark });
};

const sendLtlMessage = (port: Chat.Port, message: Chat.LtlMessage): void => {
  // const interceptor = findInterceptorFromPort(port, { message });
  // if (!interceptor) return;

  interceptor.clients.forEach(
    (clientPort) => clientPort.postMessage({ type: 'ltlMessage', message })
  );
};

const executeChatAction = async (
  // port: Chat.Port,
  message: Ytc.ParsedMessage,
  ytcfg: YtCfg,
  action: ChatUserActions,
  reportOption?: ChatReportUserOptions
): Promise<void> => {
  // const interceptor = findInterceptorFromClient(port);
  // interceptor.port?.postMessage(message);

  if (message.params == null) return;

  const fetcher = async (...args: any[]): Promise<any> => {
    return await new Promise((resolve) => {
      const encoded = JSON.stringify(args);
      window.addEventListener('proxyFetchResponse', (e) => {
        const response = JSON.parse((e as CustomEvent).detail);
        resolve(response);
      });
      window.dispatchEvent(new CustomEvent('proxyFetchRequest', {
        detail: encoded
      }));
    });
  };

  let success = true;
  try {
    // const action = msg.action;
    const apiKey = ytcfg.data_.INNERTUBE_API_KEY;
    const contextMenuUrl = 'https://www.youtube.com/youtubei/v1/live_chat/get_item_context_menu?params=' +
      `${encodeURIComponent(message.params)}&pbj=1&key=${apiKey}&prettyPrint=false`;
    const baseContext = ytcfg.data_.INNERTUBE_CONTEXT;
    function getCookie(name: string): string {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return (parts.pop() ?? '').split(';').shift() ?? '';
      return '';
    }
    const time = Math.floor(Date.now() / 1000);
    const SAPISID = getCookie('__Secure-3PAPISID');
    const sha = sha1(`${time} ${SAPISID} https://www.youtube.com`);
    const auth = `SAPISIDHASH ${time}_${sha}`;
    const heads = {
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Authorization: auth
      },
      method: 'POST'
    };
    const res = await fetcher(contextMenuUrl, {
      ...heads,
      body: JSON.stringify({ context: baseContext })
    });
    function parseServiceEndpoint(serviceEndpoint: any, prop: string): { params: string, context: any } {
      const { clickTrackingParams, [prop]: { params } } = serviceEndpoint;
      const clonedContext = JSON.parse(JSON.stringify(baseContext));
      clonedContext.clickTracking = {
        clickTrackingParams
      };
      return {
        params,
        context: clonedContext
      };
    }
    if (action === ChatUserActions.BLOCK) {
      const { params, context } = parseServiceEndpoint(
        res.liveChatItemContextMenuSupportedRenderers.menuRenderer.items[1]
          .menuNavigationItemRenderer.navigationEndpoint.confirmDialogEndpoint
          .content.confirmDialogRenderer.confirmButton.buttonRenderer.serviceEndpoint,
        'moderateLiveChatEndpoint'
      );
      await fetcher(`https://www.youtube.com/youtubei/v1/live_chat/moderate?key=${apiKey}&prettyPrint=false`, {
        ...heads,
        body: JSON.stringify({
          params,
          context
        })
      });
    } else if (action === ChatUserActions.REPORT_USER) {
      const { params, context } = parseServiceEndpoint(
        res.liveChatItemContextMenuSupportedRenderers.menuRenderer.items[0].menuServiceItemRenderer.serviceEndpoint,
        'getReportFormEndpoint'
      );
      const modal = await fetcher(`https://www.youtube.com/youtubei/v1/flag/get_form?key=${apiKey}&prettyPrint=false`, {
        ...heads,
        body: JSON.stringify({
          params,
          context
        })
      });
      const index = chatReportUserOptions.findIndex(d => d.value === reportOption);
      const options = modal.actions[0].openPopupAction.popup.reportFormModalRenderer.optionsSupportedRenderers.optionsRenderer.items;
      const submitEndpoint = options[index].optionSelectableItemRenderer.submitEndpoint;
      const clickTrackingParams = submitEndpoint.clickTrackingParams;
      const flagAction = submitEndpoint.flagEndpoint.flagAction;
      context.clickTracking = {
        clickTrackingParams
      };
      await fetcher(`https://www.youtube.com/youtubei/v1/flag/flag?key=${apiKey}&prettyPrint=false`, {
        ...heads,
        body: JSON.stringify({
          action: flagAction,
          context
        })
      });
    }
  } catch (e) {
    console.debug('Error executing chat action', e);
    success = false;
  }

  interceptor.clients.forEach(
    (clientPort) => clientPort.postMessage({
      type: 'chatUserActionResponse',
      action: action,
      message,
      success
    })
  );
};

// const sendChatUserActionResponse = (
//   port: Chat.Port,
//   message: Chat.chatUserActionResponse
// ): void => {
//   // const interceptor = findInterceptorFromPort(port, { message });
//   // if (!interceptor) return;

//   interceptor.clients.forEach(
//     (clientPort) => clientPort.postMessage(message)
//   );
// };

export const initInterceptor = (
  source: Chat.InterceptorSource,
  ytcfg: YtCfg,
  isReplay?: boolean
): void => {
  if (source === 'ytc') {
    const queue = ytcQueue(isReplay);
    let queueUnsub: Unsubscriber | undefined;
    const ytcInterceptor: Chat.YtcInterceptor = {
      ...interceptor,
      source: 'ytc',
      dark: false,
      queue,
      queueUnsub
    };
    ytcInterceptor.queueUnsub = queue.latestAction.subscribe((latestAction) => {
      if (!latestAction) return;
      interceptor.clients.forEach((port) => port.postMessage(latestAction));
    });
  } else {
    interceptor.source = source;
  }

  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message: Chat.BackgroundMessage) => {
      switch (message.type) {
        // case 'registerInterceptor':
        //   registerInterceptor(port, message.source, message.isReplay);
        //   break;
        case 'registerClient':
          registerClient(port, message.getInitialData);
          break;
        // case 'processMessageChunk':
        //   processMessageChunk(port, message);
        //   break;
        // case 'processSentMessage':
        //   processSentMessage(port, message);
        //   break;
        // case 'setInitialData':
        //   setInitialData(port, message);
        //   break;
        // case 'updatePlayerProgress':
        //   updatePlayerProgress(port, message.playerProgress, message.isFromYt);
        //   break;
        // case 'setTheme':
        //   setTheme(port, message.dark);
        //   break;
        case 'getTheme':
          getTheme(port);
          break;
        case 'sendLtlMessage':
          sendLtlMessage(port, message.message);
          break;
        case 'executeChatAction':
          executeChatAction(message.message, ytcfg, message.action, message.reportOption).catch(console.error);
          break;
        // case 'chatUserActionResponse':
        //   sendChatUserActionResponse(port, message);
        //   break;
        default:
          console.error('Unknown message type', port, message);
          break;
      }
    });
  });
};
