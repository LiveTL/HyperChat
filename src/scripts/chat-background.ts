import { Unsubscriber, ytcQueue } from '../ts/queue';
import { isValidFrameInfo } from '../ts/chat-utils';
import { isLiveTL } from '../ts/chat-constants';

const interceptors: Chat.Interceptors[] = [];

const isYtcInterceptor = (i: Chat.Interceptors): i is Chat.YtcInterceptor =>
  i.source === 'ytc';

const getPortFrameInfo = (port: Chat.Port): Chat.UncheckedFrameInfo => {
  return {
    tabId: port.sender?.tab?.id,
    frameId: port.sender?.frameId
  };
};

/**
 * Returns true if both FrameInfos are the same frame.
 */
const compareFrameInfo = (a: Chat.FrameInfo, b: Chat.FrameInfo): boolean => {
  return a.tabId === b.tabId && a.frameId === b.frameId;
};

/**
 * Returns the index of the interceptor with a matching FrameInfo.
 * Will return `-1` if no interceptor is found.
 */
const findInterceptorIndex = (frameInfo: Chat.FrameInfo): number => {
  return interceptors.findIndex(
    (i) => compareFrameInfo(i.frameInfo, frameInfo)
  );
};

/**
 * Finds and returns the interceptor with a matching FrameInfo.
 * Will return `undefined` if no interceptor is found.
 */
const findInterceptor = (frameInfo: Chat.FrameInfo, debugObject?: unknown): Chat.Interceptor | undefined => {
  const i = findInterceptorIndex(frameInfo);
  if (i < 0) {
    console.error('Interceptor not registered', debugObject);
    return;
  }
  return interceptors[i];
};

/**
 * Finds and returns the interceptor based on the given Port.
 * Should only be used for messages that are expected from interceptors.
 * Will return `undefined` if no interceptor is found.
 */
const findInterceptorFromPort = (
  port: Chat.Port,
  errorObject?: Record<string, unknown>
): Chat.Interceptor | undefined => {
  const frameInfo = getPortFrameInfo(port);
  if (!isValidFrameInfo(frameInfo, port)) return;
  return findInterceptor(
    frameInfo,
    { interceptors, port, ...errorObject }
  );
};

const findInterceptorFromClient = (
  client: Chat.Port
): Chat.Interceptor | undefined => {
  return interceptors.find((interceptor) => {
    for (const c of interceptor.clients) {
      if (c.name === client.name) return true;
    }
    return false;
  });
};

/**
 * If both port and clients are empty, removes interceptor from array.
 * Also runs the queue unsubscribe function.
 */
const cleanupInterceptor = (i: number): void => {
  const interceptor = interceptors[i];
  if (!interceptor.port && interceptor.clients.length < 1) {
    console.debug('Removing empty interceptor', { interceptor, interceptors });
    if (isYtcInterceptor(interceptor)) interceptor.queueUnsub?.();
    interceptors.splice(i, 1);
  }
};

/**
 * Register an interceptor into the `interceptors` array.
 * If an interceptor with the same FrameInfo already exists, its port will be
 * replaced with the given port instead.
 */
const registerInterceptor = (
  port: Chat.Port,
  source: Chat.InterceptorSource,
  isReplay?: boolean
): void => {
  const frameInfo = getPortFrameInfo(port);
  if (!isValidFrameInfo(frameInfo, port)) return;

  // Unregister interceptor when port disconnects
  port.onDisconnect.addListener(() => {
    const i = findInterceptorIndex(frameInfo);
    if (i < 0) {
      console.error(
        'Failed to unregister interceptor',
        { port, interceptors }
      );
      return;
    }
    interceptors[i].port = undefined;
    cleanupInterceptor(i);
    console.debug('Interceptor unregistered', { port, interceptors });
  });

  // Replace port if interceptor already exists
  const i = findInterceptorIndex(frameInfo);
  if (i >= 0) {
    console.debug(
      'Replacing existing interceptor port',
      { oldPort: interceptors[i].port, port }
    );
    interceptors[i].port = port;
    return;
  }

  // Add interceptor to array
  const interceptor = {
    frameInfo,
    port,
    clients: []
  };
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
    interceptors.push(ytcInterceptor);
    ytcInterceptor.queueUnsub = queue.latestAction.subscribe((latestAction) => {
      const interceptor = findInterceptorFromPort(port, { latestAction });
      if (!interceptor || !latestAction) return;
      interceptor.clients.forEach((port) => port.postMessage(latestAction));
    });
  } else {
    interceptors.push({ ...interceptor, source });
  }
  console.debug('New interceptor registered', { port, interceptors });
};

/**
 * Register a client to the interceptor with the matching FrameInfo.
 */
const registerClient = (
  port: Chat.Port,
  frameInfo: Chat.FrameInfo,
  getInitialData = false
): void => {
  const interceptor = findInterceptor(
    frameInfo,
    { interceptors, port, frameInfo }
  );
  if (!interceptor) return;

  if (interceptor.clients.some((client) => client.name === port.name)) {
    console.debug(
      'Client already registered. Not registering',
      { interceptors, port, frameInfo }
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

    cleanupInterceptor(findInterceptorIndex(frameInfo));
  });

  // Add client to array
  interceptor.clients.push(port);
  console.debug('Register client successful', { port, interceptor });

  if (getInitialData && isYtcInterceptor(interceptor)) {
    const payload = {
      type: 'initialData',
      initialData: interceptor.queue.getInitialData()
    } as const;
    port.postMessage(payload);
    console.debug('Sent initial data', { port, interceptor, payload });
  }
};

/**
 * Parses the given YTC json response, and adds it to the queue of the
 * interceptor that sent it.
 */
const processMessageChunk = (port: Chat.Port, message: Chat.JsonMsg): void => {
  const json = message.json;
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

  if (interceptor.clients.length < 1) {
    console.debug('No clients', { interceptor, json });
    return;
  }

  interceptor.queue.addJsonToQueue(json, false, interceptor);
};

/**
 * Parses a sent message and adds a fake message entry.
 */
const processSentMessage = (port: Chat.Port, message: Chat.JsonMsg): void => {
  const json = message.json;
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

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
const setInitialData = (port: Chat.Port, message: Chat.JsonMsg): void => {
  const json = message.json;
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

  interceptor.queue.addJsonToQueue(json, true, interceptor);

  const parsedJson = JSON.parse(json);

  const user =
    (parsedJson?.continuationContents?.liveChatContinuation ||
      parsedJson?.contents?.liveChatRenderer)
      ?.actionPanel?.liveChatMessageInputRenderer
      ?.sendButton?.buttonRenderer?.serviceEndpoint
      ?.sendLiveChatMessageEndpoint?.actions[0]
      ?.addLiveChatTextMessageFromTemplateAction?.template
      ?.liveChatTextMessageRenderer;

  if (user) interceptor.queue.selfChannel.set(user);
};

/**
 * Updates the player progress of the queue of the interceptor.
 */
const updatePlayerProgress = (port: Chat.Port, playerProgress: number): void => {
  const interceptor = findInterceptorFromPort(port, { playerProgress });
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

  interceptor.queue.updatePlayerProgress(playerProgress);
};

/**
 * Sets the theme of the interceptor, and sends the new theme to any currently
 * registered clients.
 */
const setTheme = (port: Chat.Port, dark: boolean): void => {
  const interceptor = findInterceptorFromPort(port, { dark });
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

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
const getTheme = (port: Chat.Port, frameInfo: Chat.FrameInfo): void => {
  const interceptor = findInterceptor(
    frameInfo,
    { interceptors, port, frameInfo }
  );
  if (!interceptor || !isYtcInterceptor(interceptor)) return;

  port.postMessage({ type: 'themeUpdate', dark: interceptor.dark });
};

const sendLtlMessage = (port: Chat.Port, message: Chat.LtlMessage): void => {
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor) return;

  interceptor.clients.forEach(
    (clientPort) => clientPort.postMessage({ type: 'ltlMessage', message })
  );
};

const executeChatAction = (
  port: Chat.Port,
  message: Chat.executeChatActionMsg
): void => {
  const interceptor = findInterceptorFromClient(port);
  interceptor?.port?.postMessage(message);
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: Chat.BackgroundMessage) => {
    switch (message.type) {
      case 'registerInterceptor':
        registerInterceptor(port, message.source, message.isReplay);
        break;
      case 'registerClient':
        registerClient(port, message.frameInfo, message.getInitialData);
        break;
      case 'processMessageChunk':
        processMessageChunk(port, message);
        break;
      case 'processSentMessage':
        processSentMessage(port, message);
        break;
      case 'setInitialData':
        setInitialData(port, message);
        break;
      case 'updatePlayerProgress':
        updatePlayerProgress(port, message.playerProgress);
        break;
      case 'setTheme':
        setTheme(port, message.dark);
        break;
      case 'getTheme':
        getTheme(port, message.frameInfo);
        break;
      case 'sendLtlMessage':
        sendLtlMessage(port, message.message);
        break;
      case 'executeChatAction':
        executeChatAction(port, message);
        break;
      default:
        console.error('Unknown message type', port, message);
        break;
    }
  });
});

chrome.browserAction.onClicked.addListener(() => {
  if (isLiveTL) {
    chrome.tabs.create({ url: 'https://livetl.app' }, () => {});
  } else {
    chrome.tabs.create({ url: 'https://livetl.app/en/hyperchat/' }, () => {});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getFrameInfo') {
    sendResponse({ tabId: sender.tab?.id, frameId: sender.frameId });
  } else if (request.type === 'createPopup') {
    chrome.windows.create({
      url: request.url,
      type: 'popup',
      height: 420,
      width: 690
    }, () => {});
  }
});
