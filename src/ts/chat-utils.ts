export const isLiveTL = false;
export const isAndroid = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.

export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

export enum Browser {
  FIREFOX,
  CHROME,
  SAFARI,
  ANDROID
}

export const BROWSER = (() => {
  if (navigator.userAgent.includes('Firefox')) {
    return Browser.FIREFOX;
  }
  if (isAndroid || window.chrome == null) {
    return Browser.ANDROID;
  }
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return Browser.SAFARI;
  }
  return Browser.CHROME;
})();
