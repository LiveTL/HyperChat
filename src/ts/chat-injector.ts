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

  // HyperChat frame injection notes:
  // The HyperChat frame needs to have the same origin as the parent frame ("chatframe") so
  // that e.g. Google Translate extension can access its contents.
  // At the same time, the script that the Hyperchat frame loads (hyperchat.bundle.js) needs
  // to be in the extension's namespace for chrome.runtime access.
  // If that frame's document simply uses a <script> element to import hyperchat.bundle.js,
  // it would be in the page's namespace rather than the extension's content script namespace.
  // Thus, hyperchat.bundle.js is injected as an extension content script via manifest.json,
  // while the below document.write into the HyperChat frame makes it inherit the location
  // (and thus origin) of the parent chatframe.
  // (The alternative approach of using srcdoc attribute along with match_about_blank should
  // also inherit chat-injector's origin, but Google Translate is unable to access such a
  // frame's contents for some reason.)
  // This does result in some complications regarding content script matching, but those are
  // handled in the webpack config (see contentScriptFrameFilterPlugin there).
  // Note on manifest.json config: the content script must run at document_idle (default)
  // time rather than document_start or document_end time, or else it won't actually run
  // after the document.write/close below.
  const frameInfo = await getFrameInfoAsync();
  if (!isValidFrameInfo(frameInfo)) {
    console.error('Failed to get valid frame info', { frameInfo });
    return;
  }
  const url = chrome.runtime.getURL(isLiveTL ? 'hyperchat/index.html' : 'hyperchat.html');
  const templateHtml = await(await fetch(url)).text();
  const hyperchatHtml = templateHtml
    .replace(/\{HYPERCHAT_BASE_URL\}/g, url.substr(0, url.lastIndexOf('/')));
  const frame = document.createElement('iframe');
  frame.id = 'hyperchat';
  frame.dataset.tabId = frameInfo.tabId.toString();
  frame.dataset.frameId = frameInfo.frameId.toString();
  if (frameIsReplay) frame.dataset.isReplay = ''; // sets data-is-replay attr
  frame.style.cssText = "border: 0px; width: 100%; height: 100%;";
  ytcItemList.replaceWith(frame);
  const frameDoc = frame.contentDocument!; // only exists after inserted into DOM
  frameDoc.open();
  frameDoc.write(hyperchatHtml);
  frameDoc.close();
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
