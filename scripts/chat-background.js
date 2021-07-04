import { parseChatResponse } from './chat-parser.js';

const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.
/** @typedef {{onMessage, postMessage, onDisconnect, sender?, name?}} Port */
/** @typedef {{frameInfo: FrameInfo, port: Port, clients: Port[], initialData}} Interceptor */
/** @typedef {{tabId: number, frameId: number}} FrameInfo */
/** @typedef {{type: string, frameInfo: FrameInfo, response, isReplay: boolean}} PayloadMessage */

/** @type {Interceptor[]} */
const interceptors = [];

/**
 * @param {FrameInfo} a
 * @param {FrameInfo} b
 * @return {boolean} True if both FrameInfo matches.
 */
const compareFrameInfo = (a, b) => {
  if (!a || !b) return false;
  return a.tabId === b.tabId && a.frameId === b.frameId;
};

/**
 * @param {FrameInfo} frameInfo
 * @param {string} debugText
 * @param {Object} debugObject
 * @returns {Interceptor|undefined}
 */
const findInterceptor = (frameInfo, debugText, debugObject) => {
  const interceptor = interceptors.find(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (!interceptor) {
    console.debug(`Interceptor not registered, ${debugText}`, debugObject);
  }
  return interceptor;
};

/**
 * If port and clients are empty, removes interceptor from array.
 * @param {number} i Index of interceptor
 */
const cleanupInterceptor = (i) => {
  const interceptor = interceptors[i];
  if (!interceptor.port && interceptor.clients.length < 1) {
    console.debug('Removing empty interceptor', { interceptor, interceptors });
    interceptors.splice(i, 1);
  }
};

/**
 * @param {Port} port
 */
const getPortFrameInfo = (port) => {
  return {
    tabId: port.sender.tab.id,
    frameId: port.sender.frameId
  };
}

/**
 * @param {Port} port
 */
const registerInterceptor = (port) => {
  if (!port.sender) {
    console.debug('Interceptor port has no sender, not registering', { port });
    return;
  }
  const frameInfo = getPortFrameInfo(port);

  /** Unregister interceptor when port disconnects */
  port.onDisconnect.addListener(() => {
    const i = interceptors.findIndex(
      (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
    );
    if (i < 0) {
      console.debug(
        'Failed to unregister interceptor',
        { port, interceptors }
      );
      return;
    }
    interceptors[i].port = null;
    cleanupInterceptor(i);
    console.debug('Interceptor unregistered', { port, interceptors });
  });

  /** Add interceptor to array */
  const i = interceptors.findIndex(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (i < 0) {
    interceptors.push({ frameInfo: frameInfo, port: port, clients: [] });
    console.debug('New interceptor registered', { port, interceptors });
  } else {
    console.debug(
      'Replaced existing interceptor port',
      { oldPort: interceptors[i].port, port }
    );
    interceptors[i].port = port;
  }
};

/**
 * @param {Port} port
 * @param {FrameInfo} frameInfo FrameInfo of interceptor to register on
 * @param {boolean} [getInitialData]
 */
const registerClient = (port, frameInfo, getInitialData) => {
  const interceptor = findInterceptor(
    frameInfo,
    'register client unsuccessful',
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

  /** Assign pseudo-unique name */
  port.name = `${Date.now()}${Math.random()}`;

  /** Unregister client when port disconnects */
  port.onDisconnect.addListener(() => {
    const i = interceptor.clients.findIndex(
      (clientPort) => clientPort.name === port.name
    );
    if (i < 0) {
      console.debug('Failed to unregister client', { port, interceptor });
      return;
    }
    interceptor.clients.splice(i, 1);
    console.debug('Unregister client successful', { port, interceptor });

    cleanupInterceptor(
      interceptors.findIndex(
        (interc) => compareFrameInfo(interc.frameInfo, frameInfo)
      )
    );
  });

  /** Add client to array */
  interceptor.clients.push(port);
  console.debug('Register client successful', { port, interceptor });

  if (getInitialData && interceptor.initialData) {
    port.postMessage(interceptor.initialData);
    console.debug('Sent initial data', { port, interceptor });
  }
};

/**
 * @param {Port} senderPort
 * @param {PayloadMessage} message
 */
const sendToClients = (senderPort, message) => {
  const { response, isReplay } = message;
  const frameInfo = getPortFrameInfo(senderPort);
  if (!response) {
    console.debug('Invalid response', { senderPort, frameInfo, response });
    return;
  }
  const interceptor = findInterceptor(
    frameInfo,
    'cannot send to clients',
    { interceptors, senderPort, frameInfo, response }
  );
  if (!interceptor) return;

  if (interceptor.clients.length < 1) {
    console.debug('No clients', { interceptor, response });
    return;
  }

  const payload = parseChatResponse(response, isReplay);
  if (!payload) {
    console.debug(
      'Invalid payload, not sending to clients',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  interceptor.clients.forEach((port) => port.postMessage(payload));
  console.debug('Sent to clients', { interceptor, payload });
};

/**
 * @param {Port} senderPort
 * @param {PayloadMessage} message
 */
const setInitialData = (senderPort, message) => {
  const { response, isReplay } = message;
  const frameInfo = getPortFrameInfo(senderPort);
  if (!response) {
    console.debug('Invalid response', { senderPort, frameInfo, response });
    return;
  }
  const interceptor = findInterceptor(
    frameInfo,
    'not saving initial data',
    { interceptors, senderPort, frameInfo, response }
  );
  if (!interceptor) return;

  const payload = parseChatResponse(response, isReplay, true);
  if (!payload) {
    console.debug(
      'Invalid payload, not saving initial data',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  interceptor.initialData = payload;
  console.debug('Saved initial data', { interceptor, payload });
};

/**
 * @param {Port} senderPort 
 * @param {number} playerProgress 
 */
const sendPlayerProgress = (senderPort, playerProgress) => {
  const frameInfo = getPortFrameInfo(senderPort);
  const interceptor = findInterceptor(
    frameInfo,
    'cannot send player progress',
    { interceptors, senderPort, frameInfo, playerProgress }
  );
  if (!interceptor) return;

  interceptor.clients.forEach(
    (port) => port.postMessage({ type: 'playerProgress', playerProgress })
  );
};

/** Workaround for https://github.com/LiveTL/HyperChat/issues/12 */
if (!(window.location.href.includes(`${chrome.runtime.id}/index.html`))) {
  console.log('Running in background');
  /** Handle long-lived background messaging */
  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
      if (!message.type) {
        console.debug('Message has no type', port, message);
        return;
      }

      switch (message.type) {
        case 'registerInterceptor':
          registerInterceptor(port);
          break;
        case 'registerClient':
          registerClient(port, message.frameInfo, message.getInitialData);
          break;
        case 'sendToClients':
          sendToClients(port, message);
          break;
        case 'setInitialData':
          setInitialData(port, message);
          break;
        case 'sendPlayerProgress':
          sendPlayerProgress(port, message.playerProgress);
          break;
        default:
          console.debug('Unknown message type', port, message);
          break;
      }
    });
  });

  /** Handle browser action click */
  chrome.browserAction.onClicked.addListener(() => {
    if (isLiveTL) {
      chrome.tabs.create({ url: 'https://livetl.app' });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/review') });
    }
  });

  /** Handle one-time requests */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getFrameInfo') {
      sendResponse({ tabId: sender.tab.id, frameId: sender.frameId });
    } else if (request.type === 'createPopup') {
      chrome.windows.create({
        url: request.url,
        type: 'popup',
        height: 300,
        width: 600
      });
    }
  });
}
