const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.
/** @typedef {{onMessage, postMessage, onDisconnect, sender?, name?}} Port */
/** @typedef {{frameInfo: FrameInfo, port: Port, clients: Port[], initialData}} Interceptor */
/** @typedef {{tabId: number, frameId: number}} FrameInfo */

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
 * Register a new interceptor.
 * Will immediately respond with its FrameInfo on success.
 * @param {Port} port
 */
const registerInterceptor = (port) => {
  if (!port.sender) {
    console.debug('Interceptor port has no sender, not registering', { port });
    return;
  }
  const frameInfo = {
    tabId: port.sender.tab.id,
    frameId: port.sender.frameId
  };

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
    console.debug('New interceptor registered', { port });
  } else {
    console.debug(
      'Replaced existing interceptor port',
      { oldPort: interceptors[i].port, port }
    );
    interceptors[i].port = port;
  }
  port.postMessage({ type: 'interceptorRegistered', frameInfo: frameInfo });
};

/**
 * @param {Port} port
 * @param {FrameInfo} frameInfo
 * @param {boolean} [getInitialData]
 */
const registerClient = (port, frameInfo, getInitialData) => {
  const interceptor = interceptors.find(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (!interceptor) {
    console.debug(
      'Failed to find interceptor, register client unsuccessful',
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
 * @param {FrameInfo} frameInfo
 * @param {*} payload
 */
const sendToClients = (senderPort, frameInfo, payload) => {
  if (!payload) {
    console.debug(
      'Invalid payload, not sending to clients',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  const interceptor = interceptors.find(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (!interceptor) {
    console.debug(
      'Interceptor not registered, no clients to send to',
      { interceptors, senderPort, frameInfo, payload }
    );
    return;
  }

  if (interceptor.clients.length < 1) {
    console.debug('No clients to send to', { interceptor, payload });
    return;
  }

  interceptor.clients.forEach((port) => port.postMessage(payload));
  console.debug('Sent to clients', { interceptor, payload });
};

/**
 * @param {Port} senderPort
 * @param {FrameInfo} frameInfo
 * @param {*} payload
 */
const setInitialData = (senderPort, frameInfo, payload) => {
  if (!payload) {
    console.debug(
      'Invalid payload, not saving as initial data',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  const interceptor = interceptors.find(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (!interceptor) {
    console.debug(
      'Interceptor not registered, not saving as initial data',
      { interceptors, senderPort, frameInfo, payload }
    );
    return;
  }

  interceptor.initialData = payload;
  console.debug('Saved initial data', { interceptor, payload });
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
          sendToClients(port, message.frameInfo, message.payload);
          break;
        case 'setInitialData':
          setInitialData(port, message.frameInfo, message.payload);
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
