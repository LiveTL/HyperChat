import type { Unsubscriber } from './queue';
import { isValidFrameInfo } from './chat-utils';
import { isLiveTL } from './chat-constants';
import { ytcQueue } from './queue';

const interceptors: Chat.Interceptor[] = [];

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

/**
 * If both port and clients are empty, removes interceptor from array.
 * Also runs the queue unsubscribe function.
 */
const cleanupInterceptor = (i: number): void => {
  const interceptor = interceptors[i];
  if (!interceptor.port && interceptor.clients.length < 1) {
    console.debug('Removing empty interceptor', { interceptor, interceptors });
    interceptor.queueUnsub?.();
    interceptors.splice(i, 1);
  }
};

/**
 * Register an interceptor into the `interceptors` array.
 * If an interceptor with the same FrameInfo already exists, its port will be
 * replaced with the given port instead.
 */
const registerInterceptor = (port: Chat.Port, isReplay: boolean): void => {
  const frameInfo = getPortFrameInfo(port);
  if (!isValidFrameInfo(frameInfo, port)) return;

  // Add interceptor to array
  const i = findInterceptorIndex(frameInfo);
  if (i < 0) {
    const queue = ytcQueue(isReplay);
    let queueUnsub: Unsubscriber | undefined;
    const newInterceptor = {
      frameInfo,
      port,
      clients: [],
      dark: false,
      queue,
      queueUnsub
    };
    interceptors.push(newInterceptor);
    newInterceptor.queueUnsub = queue.latestAction.subscribe((latestAction) => {
      const interceptor = findInterceptorFromPort(port, { latestAction });
      if (!interceptor || !latestAction) return;
      interceptor.clients.forEach((port) => port.postMessage(latestAction));
    });
    console.debug('New interceptor registered', { port, interceptors });
  } else {
    console.debug(
      'Replacing existing interceptor port',
      { oldPort: interceptors[i].port, port }
    );
    interceptors[i].port = port;
  }

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

  if (getInitialData) {
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
const processJson = (port: Chat.Port, message: Chat.JsonMsg): void => {
  const json = message.json;
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor) return;

  if (interceptor.clients.length < 1) {
    console.debug('No clients', { interceptor, json });
    return;
  }

  interceptor.queue.addJsonToQueue(json, false, interceptor);
};

/**
 * Parses the givevn YTC json response, and sets it as the initial data of
 * the interceptor that sent it.
 */
const setInitialData = (port: Chat.Port, message: Chat.JsonMsg): void => {
  const json = message.json;
  const interceptor = findInterceptorFromPort(port, { message });
  if (!interceptor) return;

  interceptor.queue.addJsonToQueue(json, true, interceptor);
};

/**
 * Updates the player progress of the queue of the interceptor.
 */
const updatePlayerProgress = (port: Chat.Port, playerProgress: number): void => {
  const interceptor = findInterceptorFromPort(port, { playerProgress });
  if (!interceptor) return;

  interceptor.queue.updatePlayerProgress(playerProgress);
};

/**
 * Sets the theme of the interceptor, and sends the new theme to any currently
 * registered clients.
 */
const setTheme = (port: Chat.Port, dark: boolean): void => {
  const interceptor = findInterceptorFromPort(port, { dark });
  if (!interceptor) return;

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
  if (!interceptor) return;

  port.postMessage({ type: 'themeUpdate', dark: interceptor.dark });
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: Chat.BackgroundMessage) => {
    switch (message.type) {
      case 'registerInterceptor':
        registerInterceptor(port, message.isReplay);
        break;
      case 'registerClient':
        registerClient(port, message.frameInfo, message.getInitialData);
        break;
      case 'processJson':
        processJson(port, message);
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
      default:
        console.error('Unknown message type', port, message);
        break;
    }
  });
});

chrome.browserAction.onClicked.addListener(() => {
  if (isLiveTL) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    chrome.tabs.create({ url: 'https://livetl.app' });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    chrome.tabs.create({ url: 'https://livetl.app/en/hyperchat/' });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getFrameInfo') {
    sendResponse({ tabId: sender.tab?.id, frameId: sender.frameId });
  } else if (request.type === 'createPopup') {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    chrome.windows.create({
      url: request.url,
      type: 'popup',
      height: 300,
      width: 600
    });
  }
});
