import HcButton from '../components/HyperchatButton.svelte';
import { getFrameInfoAsync } from './chat-utils';

const isLiveTL = false;
const isAndroid = false;
// DO NOT EDIT THE ABOVE LINES, they will be updated by webpack.
const isFirefox = navigator.userAgent.includes('Firefox');

const chatLoaded = () => {
  if (document.querySelector('.toggleButton')) {
    console.debug('HC Button already injected.');
    return;
  }

  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const hyperChatEnabled = localStorage.getItem('HC:ENABLED') !== 'false';

  /** Inject HC button */
  const ytcPrimaryContent = document.querySelector('#primary-content');
  if (!ytcPrimaryContent) {
    console.error('Failed to find #primary-content');
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hcButton = new HcButton({
    target: ytcPrimaryContent
  });

  if (!hyperChatEnabled) return;

  const ytcItemList = document.querySelector('#chat>#item-list');
  if (!ytcItemList) {
    console.debug('Failed to find #chat>#item-list');
    return;
  }

  /** Inject hyperchat */
  const source = chrome.runtime.getURL('hyperchat.html');
  ytcItemList.outerHTML = `
  <iframe id='hyperchat' src='${source}${(!isAndroid && isLiveTL ? '#isLiveTL' : '')}' style='border: 0px; width: 100%; height: 100%'></iframe>
  `;
  const hyperchat = document.querySelector('#hyperchat') as HTMLIFrameElement;
  if (!hyperchat) {
    console.debug('Failed to find #hyperchat');
    return;
  }
  if (isFirefox || isLiveTL) {
    const scale = 0.8;
    const inverse = `${Math.round((1 / scale) * 10000) / 100}%`;
    hyperchat.style.transformOrigin = '0px 0px';
    hyperchat.style.minWidth = inverse;
    hyperchat.style.minHeight = inverse;
    hyperchat.style.transform = `scale(${scale})`;
  }

  const ytcTicker = document.querySelector('#ticker');
  if (!ytcTicker) {
    console.debug('Failed to find #ticker');
    return;
  }
  ytcTicker.remove();

  /** Forward theme and yt-player-video-progress to optichat */
  const html = document.querySelector('html');
  const hyperchatWindow = hyperchat.contentWindow;
  if (!html || !hyperchatWindow) {
    console.debug('Failed to get hyperchat contentWindow');
    return;
  }
  const sendTheme = () => {
    const theme = html.hasAttribute('dark');
    hyperchatWindow.postMessage({
      'yt-live-chat-set-dark-theme': theme
    }, '*');
  };
  new MutationObserver(sendTheme).observe(html, {
    attributes: true
  });
  window.addEventListener('message', d => {
    if (d.data.type === 'getTheme') {
      sendTheme();
    }
  });

  // Note: iframe readyState is always 'complete' even when it shouldn't be
  hyperchat.addEventListener('load', async () => {
    /** Forward frameInfo to optichat for background messaging */
    const frameInfo = await getFrameInfoAsync();
    hyperchatWindow.postMessage(
      { type: 'frameInfo', frameInfo }, '*'
    );
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
