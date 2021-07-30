import { parseChatResponse } from './chat-parser';

const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.

const interceptors: Chat.Interceptor[] = [];

const compareFrameInfo = (a: Chat.FrameInfo, b: Chat.FrameInfo) => {
  return a.tabId === b.tabId && a.frameId === b.frameId;
};

const findInterceptor = (frameInfo: Chat.FrameInfo, debugObject: unknown) => {
  const interceptor = interceptors.find(
    (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
  );
  if (!interceptor) {
    console.error('Interceptor not registered', debugObject);
  }
  return interceptor;
};

/**
 * If port and clients are empty, removes interceptor from array.
 */
const cleanupInterceptor = (index: number) => {
  const interceptor = interceptors[index];
  if (!interceptor.port && interceptor.clients.length < 1) {
    console.debug('Removing empty interceptor', { interceptor, interceptors });
    interceptors.splice(index, 1);
  }
};

const getPortFrameInfo = (port: Chat.Port): Chat.UncheckedFrameInfo => {
  return {
    tabId: port.sender?.tab?.id,
    frameId: port.sender?.frameId
  };
};

const registerInterceptor = (port: Chat.Port) => {
  const frameInfo = getPortFrameInfo(port);
  if (!Chat.validFrameInfo(frameInfo, port)) return;

  // Unregister interceptor when port disconnects
  port.onDisconnect.addListener(() => {
    const i = interceptors.findIndex(
      (interceptor) => compareFrameInfo(interceptor.frameInfo, frameInfo)
    );
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

  // Add interceptor to array
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

const registerClient = (port: Chat.Port, frameInfo: Chat.FrameInfo, getInitialData = false) => {
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

    cleanupInterceptor(
      interceptors.findIndex(
        (interc) => compareFrameInfo(interc.frameInfo, frameInfo)
      )
    );
  });

  // Add client to array
  interceptor.clients.push(port);
  console.debug('Register client successful', { port, interceptor });

  if (getInitialData && interceptor.initialData) {
    port.postMessage(interceptor.initialData);
    console.debug('Sent initial data', { port, interceptor });
  }
};

const sendToClients = (senderPort: Chat.Port, message: Chat.ResponseMsg) => {
  const { response, isReplay } = message;
  const frameInfo = getPortFrameInfo(senderPort);
  if (!Chat.validFrameInfo(frameInfo, senderPort)) return;
  const interceptor = findInterceptor(
    frameInfo,
    { interceptors, senderPort, frameInfo, response }
  );
  if (!interceptor) return;

  if (interceptor.clients.length < 1) {
    console.debug('No clients', { interceptor, response });
    return;
  }

  const payload = parseChatResponse(response, isReplay);
  if (!payload) {
    console.error(
      'Invalid payload, not sending to clients',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  interceptor.clients.forEach((port) => port.postMessage(payload));
  console.debug('Sent to clients', { interceptor, payload });
};

const setInitialData = (senderPort: Chat.Port, message: Chat.ResponseMsg) => {
  const { response, isReplay } = message;
  const frameInfo = getPortFrameInfo(senderPort);
  if (!Chat.validFrameInfo(frameInfo, senderPort)) return;
  const interceptor = findInterceptor(
    frameInfo,
    { interceptors, senderPort, frameInfo, response }
  );
  if (!interceptor) return;

  const payload = parseChatResponse(response, isReplay, true);
  if (!payload) {
    console.error(
      'Invalid payload, not saving initial data',
      { senderPort, frameInfo, payload }
    );
    return;
  }
  interceptor.initialData = payload;
  console.debug('Saved initial data', { interceptor, payload });
};

const sendPlayerProgress = (senderPort: Chat.Port, playerProgress: number) => {
  const frameInfo = getPortFrameInfo(senderPort);
  if (!Chat.validFrameInfo(frameInfo, senderPort)) return;
  const interceptor = findInterceptor(
    frameInfo,
    { interceptors, senderPort, frameInfo, playerProgress }
  );
  if (!interceptor) return;

  interceptor.clients.forEach(
    (port) => port.postMessage({ type: 'playerProgress', playerProgress })
  );
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: Chat.BackgroundMessage) => {
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
        console.error('Unknown message type', port, message);
        break;
    }
  });
});

chrome.browserAction.onClicked.addListener(() => {
  if (isLiveTL) {
    chrome.tabs.create({ url: 'https://livetl.app' });
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/review') });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getFrameInfo') {
    sendResponse({ tabId: sender.tab?.id, frameId: sender.frameId });
  } else if (request.type === 'createPopup') {
    chrome.windows.create({
      url: request.url,
      type: 'popup',
      height: 300,
      width: 600
    });
  }
});
