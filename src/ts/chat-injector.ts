import HcButton from '../components/HyperchatButton.svelte';
import { getFrameInfoAsync, isValidFrameInfo, frameIsReplay } from './chat-utils';
import { isLiveTL, isAndroid } from './chat-constants';

// const isFirefox = navigator.userAgent.includes('Firefox');

const hcWarning = 'An existing HyperChat button has been detected. This ' +
  'usually means both LiveTL and standalone HyperChat are enabled. ' +
  'LiveTL already includes HyperChat, so please enable only one of them.\n\n' +
  'Having multiple instances of the same scripts running WILL cause ' +
  'problems such as chat messages not loading.';

const chatLoaded = async (): Promise<void> => {
  if (document.querySelector('.toggleButton')) {
    console.error(hcWarning);
    return;
  }

  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const hyperChatEnabled = localStorage.getItem('HC:ENABLED') !== 'false';

  // Inject HC button
  const ytcPrimaryContent = document.querySelector('#primary-content');
  if (!ytcPrimaryContent) {
    console.error('Failed to find #primary-content');
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hcButton = new HcButton({
    target: ytcPrimaryContent
  });

  // Everything past this point will only run if HC is enabled
  if (!hyperChatEnabled) return;

  const ytcItemList = document.querySelector('#chat>#item-list');
  if (!ytcItemList) {
    console.error('Failed to find #chat>#item-list');
    return;
  }

  // Inject hyperchat
  const frameInfo = await getFrameInfoAsync();
  if (!isValidFrameInfo(frameInfo)) {
    console.error('Failed to get valid frame info', { frameInfo });
    return;
  }
  const url = chrome.runtime.getURL(isLiveTL ? 'hyperchat/index.html' : 'hyperchat.html');
  // hyperchat.html will be loaded in an about:srcdoc iframe so that it has same origin as parent YT livechat frame
  // to avoid cross-origin issues. Due to this, hyperchat(.bundle.js) is indirectly inserted as a content script
  // (see manifest.json and hyperchat-frame.js) so that it has access to chrome.runtime.
  const templateHtml = await(await fetch(url)).text();
  const hyperchatHtml = templateHtml
    .replace(/\{HYPERCHAT_BASE_URL\}/g, url.substr(0, url.lastIndexOf('/')));
    // Hack to remove the hyperchat.bundle.js script element.
    //.replace(/\s*<\s*script\s+[^>]*src\s*=\s*(?:['"](?:.\/)?hyperchat\.bundle\.js['"])[^>]*>\s*(?:<\s*\/\s*script\s*>\s*)?/i, '');
  console.log(hyperchatHtml, new DOMParser().parseFromString(hyperchatHtml, 'text/html'));
  const frame = document.createElement('iframe');
  frame.id = 'hyperchat';
  frame.dataset.tabId = frameInfo.tabId.toString();
  frame.dataset.frameId = frameInfo.frameId.toString();
  if (frameIsReplay) frame.dataset.isReplay = ''; // sets data-is-replay attr
  frame.style.cssText = "border: 0px; width: 100%; height: 100%;";
  // Using srcdoc attribute instead of document.open/write/close after insertion since
  // the latter sets the frame's location to same as parent frame's rather than about:blank,
  // which causes our content scripts to erroneously match against it again.
  //frame.src = 'about:blank';
  frame.srcdoc = hyperchatHtml;
  ytcItemList.replaceWith(frame);
  console.log('created hyperchat frame', frame);
  //const frameDoc = frame.contentDocument!;
  //frameDoc.open();
  //frameDoc.write(hyperchatHtml);
  //frameDoc.close();
  // const hyperchat = document.querySelector('#hyperchat') as HTMLIFrameElement;
  // if (!hyperchat) {
  //   console.error('Failed to find #hyperchat');
  //   return;
  // }
  // if (isFirefox || isLiveTL) {
  //   const scale = 0.8;
  //   const inverse = `${Math.round((1 / scale) * 10000) / 100}%`;
  //   hyperchat.style.transformOrigin = '0px 0px';
  //   hyperchat.style.minWidth = inverse;
  //   hyperchat.style.minHeight = inverse;
  //   hyperchat.style.transform = `scale(${scale})`;
  // }

  // Remove ticker element
  const ytcTicker = document.querySelector('#ticker');
  if (!ytcTicker) {
    console.error('Failed to find #ticker');
    return;
  }
  ytcTicker.remove();

  // Hide input panel on android
  if (isAndroid) {
    const inputPanel = document.querySelector('#input-panel');
    if (!inputPanel) return;
    (inputPanel as HTMLElement).style.display = 'none';
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => async () => await chatLoaded());
} else {
  chatLoaded().catch(e => console.error(e));
}
