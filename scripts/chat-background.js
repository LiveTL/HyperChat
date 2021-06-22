const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.
/** @typedef {{onMessage, postMessage, onDisconnect, sender?, name?}} Port */
/** @typedef {{frameInfo: FrameInfo, port: Port, clients: Port[]}} Interceptor */

/** @type {Interceptor[]} */
const interceptors = [];

/** Tab and frame info of an interceptor. */
class FrameInfo {
  /**
   * @param {number} tabId
   * @param {number} frameId
   */
  constructor(tabId, frameId) {
    this.tabId = tabId;
    this.frameId = frameId;
  }

  /**
   * @param {FrameInfo} frameInfo
   * @return {boolean} True if frameInfo matches `this`.
   */
  compare(frameInfo) {
    return this.tabId === frameInfo.tabId &&
      this.frameId === frameInfo.frameId;
  }
}

chrome.browserAction.onClicked.addListener(() => {
  if (isLiveTL) {
    chrome.tabs.create({ url: 'https://livetl.app' });
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/review') });
  }
});

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

  const frameInfo = new FrameInfo(port.sender.tab.id, port.sender.frameId);

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
  const tabId = port.sender.tab.id;
  const frameId = port.sender.frameId;
  const frameInfo = new FrameInfo(tabId, frameId);

  if (interceptors.some(
    (interceptor) => interceptor.frameInfo.compare(frameInfo)
  )) {
    console.debug('Interceptor already registered, not registering', { port, interceptors });
    return;
  }

  // Unregister interceptor when port disconnects
  port.onDisconnect.addListener(() => {
    const i = interceptors.findIndex(
      (interceptor) => interceptor.frameInfo.compare(frameInfo)
    );
    if (i < 0) {
      console.debug('Failed to unregister interceptor', { port, interceptors });
      return;
    }
    interceptors.splice(i, 1);
    console.debug('Unregister intercepter successful', { port, interceptors });
  });

  interceptors.push({ frameInfo: frameInfo, port: port, clients: [] });
  port.postMessage({ type: 'interceptorRegistered', frameInfo: frameInfo });
  console.debug('Register interceptor successful', { frameInfo });
};

/**
 * Register a new client to an interceptor.
 * Client port MUST have a name.
 *
 * @param {Port} port
 * @param {FrameInfo} frameInfo
 */
const registerClient = (port, frameInfo) => {
  if (!port.name || port.name === '') {
    port.name = `${Date.now()}${Math.random()}`;
    console.debug('Gave client port a name', { port, frameInfo });
    // return;
  }

  const registered = interceptors.some((interceptor) => {
    if (!interceptor.frameInfo.compare(frameInfo)) {
      return false;
    }

    // Unregister client when port disconnects
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

    interceptor.clients.push(port);
    console.debug('Register client successful', { interceptor, port });
    return true;
  });

  if (!registered) {
    console.debug(
      'Failed to register client', { interceptors, port, frameInfo }
    );
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
  if (!frameInfo || !payload) {
    console.debug(
      'Invalid message, not sending to clients',
      { senderPort, frameInfo, payload }
    );
    return;
  }

  const sent = interceptors.some((interceptor) => {
    if (!interceptor.frameInfo.compare(frameInfo)) {
      return false;
    }

    if (interceptor.clients.length < 1) {
      console.debug('No clients to send to', { interceptor, payload });
      return true;
    }

    interceptor.clients.forEach((port) => port.postMessage(payload));
    console.debug('Sent to clients', { interceptor, payload });
    return true;
  });

  if (!sent) {
    console.debug(
      'Interceptor not registered, no clients to send to',
      { interceptors, senderPort, frameInfo, payload }
    );
  }
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
        registerClient(port, message.frameInfo);
        break;
      case 'sendToClients':
        sendToClients(
          port, message.frameInfo, message.payload
        );
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
