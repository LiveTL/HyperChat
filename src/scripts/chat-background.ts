import { isLiveTL, Browser, getBrowser } from '../ts/chat-constants';

chrome.action.onClicked.addListener(() => {
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
      type: 'popup'
    }, () => {});
  }
});

// ff doesn't support extension to content script raw messaging yet
// so we proxy the messaging
if (getBrowser() == Browser.FIREFOX) {
  chrome.runtime.onConnect.addListener(hc => {
    // frameId and tabId should be int
    const { frameId, tabId } = JSON.parse(hc.name);
    const interceptorPort = chrome.tabs.connect(tabId, { frameId });
    interceptorPort.onMessage.addListener(msg => {
      hc.postMessage(msg);
    });
    hc.onMessage.addListener(msg => {
      interceptorPort.postMessage(msg);
    });
  });
}
