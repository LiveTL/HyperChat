import { isLiveTL } from '../ts/chat-constants';

const noUpdateKeys = new Set(['hc.bytes.used', 'hc.bytes.update']);
const oneDay = 1000 * 60 * 60 * 24;

const storageget = (key: string): any => chrome.storage.local.get(key).then(r => r[key]);
const defaultTo0 = (value: any): number => isNaN(value) ? 0 : value;

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

chrome.runtime.onConnect.addListener(hc => {
  // frameId and tabId should be int
  // TODO use frameId, it is needed for holodex multiple yt in one tab
  const { tabId } = JSON.parse(hc.name);
  const interceptorPort = chrome.tabs.connect(tabId);

  const onInterceptorMessage = (msg): void => {
    hc.postMessage(msg);
  };
  interceptorPort.onMessage.addListener(onInterceptorMessage);
  interceptorPort.onDisconnect.addListener(() => {
    interceptorPort.onMessage.removeListener(onInterceptorMessage);
    hc.disconnect();
  });

  const onHcMessage = (msg): void => {
    interceptorPort.postMessage(msg);
  };
  hc.onMessage.addListener(onHcMessage);
  hc.onDisconnect.addListener(() => {
    hc.onMessage.removeListener(onHcMessage);
    interceptorPort.disconnect();
  });
});

// see https://i.imgur.com/cGciqrX.png
chrome.storage.local.onChanged.addListener(changes => {
  let delta = 0;
  for (const key of Object.keys(changes)) {
    if (noUpdateKeys.has(key)) continue;
    const { oldValue, newValue } = changes[key];
    delta += oldValue === undefined
      ? (key + JSON.stringify(newValue)).length
      : JSON.stringify(newValue).length - JSON.stringify(oldValue).length;
  }
  if (delta === 0) return;

  // avoid top-level async
  // see https://stackoverflow.com/a/53024910
  (async () => {
    const toWrite = {};
    const data = await Promise.all([
      storageget('hc.bytes.used'),
      storageget('hc.bytes.lastupdate')
    ]);
    let bytesused = defaultTo0(data[0]);
    const lastupdate = defaultTo0(data[1]);
    const now = Date.now();

    // see https://i.imgur.com/S0i9oS4.png
    //     https://i.imgur.com/PpBepQ0.png
    if (now - lastupdate >= oneDay) {
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=1385832#c20
      bytesused = new TextEncoder().encode(
        Object.entries(await chrome.storage.local.get())
          .map(([key, value]) => key + JSON.stringify(value))
          .join('')
      ).length;
      toWrite['hc.bytes.lastupdate'] = now;
    }

    // storage transaction with 2 awaits -> potential data race???
    toWrite['hc.bytes.used'] = bytesused + delta;
    await chrome.storage.local.set(toWrite);
  })();
  return true;
});
