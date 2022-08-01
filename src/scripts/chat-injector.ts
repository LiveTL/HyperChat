import HcButton from '../components/HyperchatButton.svelte';
import { getFrameInfoAsync, isValidFrameInfo, frameIsReplay, checkInjected } from '../ts/chat-utils';
import { isLiveTL, isAndroid } from '../ts/chat-constants';
import { hcEnabled, autoLiveChat } from '../ts/storage';

// const isFirefox = navigator.userAgent.includes('Firefox');

const hcWarning = 'An existing HyperChat button has been detected. This ' +
  'usually means both LiveTL and standalone HyperChat are enabled. ' +
  'LiveTL already includes HyperChat, so please enable only one of them.\n\n' +
  'Having multiple instances of the same scripts running WILL cause ' +
  'problems such as chat messages not loading.';

const chatLoaded = async (): Promise<void> => {
  if (!isLiveTL && checkInjected(hcWarning)) return;

  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const hyperChatEnabled = await hcEnabled.get();

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
  const params = new URLSearchParams();
  params.set('tabid', frameInfo.tabId.toString());
  params.set('frameid', frameInfo.frameId.toString());
  try {
    params.set('isYtFrame', window.parent.location.href !== window.location.href ? '1' : '0');
  } catch {
  }
  if (frameIsReplay) params.set('isReplay', 'true');
  const source = chrome.runtime.getURL(
    (isLiveTL ? 'hyperchat/index.html' : 'hyperchat.html') +
    `?${params.toString()}`
  );
  ytcItemList.outerHTML = `
  <iframe id="hyperchat" src="${source}" style="border: 0px; width: 100%; height: 100%;"/>
  `;
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

  if (await autoLiveChat.get()) {
    const live = document.querySelector<HTMLElement>('tp-yt-paper-listbox#menu > :nth-child(2)');
    if (!live) {
      console.error('Failed to find Live Chat menu item');
      return;
    }
    live.click();
  }
};

if (isLiveTL) {
  chatLoaded().catch(console.error);
} else {
  setTimeout(() => {
    chatLoaded().catch(console.error);
  }, 500);
}
