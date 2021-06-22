const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.
/** @typedef {{onMessage, postMessage, onDisconnect, sender?, name?}} Port */
/** @typedef {{frameInfo: FrameInfo, port: Port, clients: Port[], initialData}} Interceptor */
/** @typedef {{tabId: number, frameId: number}} FrameInfo */

/** @type {Interceptor[]} */
const interceptors = [];

chrome.browserAction.onClicked.addListener(() => {
  if (isLiveTL) {
    chrome.tabs.create({ url: 'https://livetl.app' });
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/review') });
  }
});

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
 * Respond with sender's frame info.
 *
 * @param {Port} port
 */
const queryFrameInfo = (port) => {
  const sender = port.sender;
  if (!sender) {
    console.debug('Port has no sender, query failed', { port });
    return;
  }

  const frameInfo = {
    tabId: port.sender.tab.id,
    frameId: port.sender.frameId
  };

  port.postMessage({ type: 'queryResult', frameInfo });
  console.debug('Query successful', { port, frameInfo });
};

/**
 * Register a new interceptor.
 * Will immediately respond with its FrameInfo on success.
 *
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

  /** Check if interceptor already registered */
  if (interceptors.some(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  )) {
    console.debug(
      'Interceptor already registered, not registering',
      { port, interceptors }
    );
    return;
  }

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
    interceptors.splice(i, 1);
    console.debug('Unregister intercepter successful', { port, interceptors });
  });

  /** Add interceptor to array */
  interceptors.push({ frameInfo: frameInfo, port: port, clients: [] });
  port.postMessage({ type: 'interceptorRegistered', frameInfo: frameInfo });
  console.debug('Register interceptor successful', { frameInfo });
};

/**
 * Register a new client to an interceptor.
 *
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
 * Send payload to clients of interceptors with matching frameInfo
 *
 * @param {Port} senderPort
 * @param {FrameInfo} frameInfo
 * @param {any} payload
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

/** Start background messaging */
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    if (!message.type) {
      console.debug('Message has no type', port, message);
      return;
    }

    switch (message.type) {
      case 'queryFrameInfo':
        queryFrameInfo(port);
        break;
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

// Interceptor register - save frameInfo
// Client register with matching frameInfo - save as clients of matching interceptor
// Interceptor send response object - send to all clients
